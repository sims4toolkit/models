import type { ResourceKeyPair } from "../types";
import { BinaryEncoder } from "@s4tk/encoding";

const HEADER_BYTE_SIZE = 96;

/**
 * Writes the given resource entries into a DBPF buffer.
 * 
 * @param dbpf DBPF model to serialize into a buffer
 */
export default function writeDbpf(entries: ResourceKeyPair[]): Buffer {
  const entryBuffers: Buffer[] = []; // just in case models aren't cached
  const recordsBuffer = Buffer.concat(entries.map(entry => {
    const buffer = entry.buffer;
    entryBuffers.push(buffer);
    return buffer;
  }));

  const indexBuffer: Buffer = (() => {
    // each entry is 32 bytes, and flags are 4
    const buffer = Buffer.alloc(entries.length * 32 + 4);
    const encoder = new BinaryEncoder(buffer);

    encoder.skip(4); // flags will always be written as null

    let recordOffset = 0;
    entries.forEach((entry, i) => {
      const entryBuffer = entryBuffers[i];
      encoder.uint32(entry.key.type); // mType
      encoder.uint32(entry.key.group); // mGroup
      encoder.uint32(Number(entry.key.instance >> 32n)); // mInstanceEx
      encoder.uint32(Number(entry.key.instance & 0xFFFFFFFFn)); // mInstance
      encoder.uint32(HEADER_BYTE_SIZE + recordOffset); // mnPosition
      recordOffset += entryBuffer.byteLength;
      encoder.uint32(entryBuffer.byteLength + 0x80000000); // mnSize + mbExtendedCompressionType
      // FIXME: if models aren't cached, then buffer is being serialized here again
      encoder.uint32(entry.value.sizeDecompressed ?? entry.value.buffer.byteLength); // mnSizeDecompressed
      encoder.uint16(entry.value.compressionType); // mnCompressionType
      encoder.uint16(1); // mnCommitted // NOTE: is this always 1?
    });

    return buffer;
  })();

  const headerBuffer: Buffer = (() => {
    const buffer = Buffer.alloc(HEADER_BYTE_SIZE);
    const encoder = new BinaryEncoder(buffer);

    encoder.charsUtf8("DBPF");
    encoder.uint32(2); // version major
    encoder.uint32(1); // version minor
    encoder.skip(24); // mnUserVersion through unused2
    encoder.uint32(entries.length); // mnIndexRecordEntryCount
    encoder.skip(4); // mnIndexRecordPositionLow
    encoder.uint32(indexBuffer.byteLength); // mnIndexRecordSize
    encoder.skip(12); // unused3
    encoder.uint32(3); // unused4
    encoder.uint64(recordsBuffer.byteLength + HEADER_BYTE_SIZE); // index position
    // intentionally ignoring unused5

    return buffer;
  })();

  return Buffer.concat([
    headerBuffer,
    recordsBuffer,
    indexBuffer
  ]);
}
