import type { CompressedBuffer } from "@s4tk/compression";
import { BinaryEncoder } from "@s4tk/encoding";
import type { ResourceKeyPair } from "../types";

const HEADER_BYTE_SIZE = 96;

/**
 * Writes the given resource entries into a DBPF buffer.
 * 
 * @param entries DBPF entries to serialize into a buffer
 * @param minify Whether or not resources should be minified
 */
export default function writeDbpf(entries: ResourceKeyPair[], minify = false): Buffer {
  const entryBuffers: CompressedBuffer[] = [];

  const indexBuffer: Buffer = (() => {
    // each entry is 32 bytes, and flags are 4
    const buffer = Buffer.alloc(entries.length * 32 + 4);
    const encoder = new BinaryEncoder(buffer);

    encoder.skip(4); // flags will always be written as null

    let recordOffset = 0;
    entries.forEach((entry) => {
      // FIXME: shouldn't there be an option to save buffers?
      const entryBuffer = entry.value.getCompressedBuffer(undefined, undefined, minify);
      entryBuffers.push(entryBuffer);
      encoder.uint32(entry.key.type); // mType
      encoder.uint32(entry.key.group); // mGroup
      encoder.uint32(Number(entry.key.instance >> 32n)); // mInstanceEx
      encoder.uint32(Number(entry.key.instance & 0xFFFFFFFFn)); // mInstance
      encoder.uint32(HEADER_BYTE_SIZE + recordOffset); // mnPosition
      recordOffset += entryBuffer.buffer.byteLength;
      encoder.uint32(entryBuffer.buffer.byteLength + 0x80000000); // mnSize + mbExtendedCompressionType
      encoder.uint32(entryBuffer.sizeDecompressed); // mnSizeDecompressed
      encoder.uint16(entryBuffer.compressionType); // mnCompressionType
      encoder.uint16(1); // mnCommitted // NOTE: is this always 1?
    });

    return buffer;
  })();

  const recordsBuffer = Buffer.concat(entryBuffers.map(e => e.buffer));

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
