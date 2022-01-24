import { ResourceKeyPair, ZLIB_COMPRESSION } from "../shared";
import { BinaryEncoder } from "@s4tk/encoding";

const HEADER_BYTE_SIZE = 96;

/**
 * Writes the given resource entries into a DBPF buffer.
 * 
 * @param dbpf DBPF model to serialize into a buffer
 */
export default function writeDbpf(entries: ResourceKeyPair[]): Buffer {
  const recordsBuffer = Buffer.concat(entries.map(entry => entry.buffer));

  const indexBuffer: Buffer = (() => {
    // each entry is 32 bytes, and flags are 4
    const buffer = Buffer.alloc(entries.length * 32 + 4);
    const encoder = new BinaryEncoder(buffer);

    encoder.skip(4); // flags will always be written as null

    let recordOffset = 0;
    entries.forEach(entry => {
      encoder.uint32(entry.key.type); // mType
      encoder.uint32(entry.key.group); // mGroup
      encoder.uint32(Number(entry.key.instance >> 32n)); // mInstanceEx
      encoder.uint32(Number(entry.key.instance & 0xFFFFFFFFn)); // mInstance
      encoder.uint32(HEADER_BYTE_SIZE + recordOffset); // mnPosition
      recordOffset += entry.buffer.byteLength;
      encoder.uint32(entry.buffer.byteLength + 0x80000000); // mnSize + mbExtendedCompressionType
      encoder.uint32(entry.value.buffer.byteLength); // mnSizeDecompressed
      encoder.uint16(ZLIB_COMPRESSION); // mnCompressionType
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
