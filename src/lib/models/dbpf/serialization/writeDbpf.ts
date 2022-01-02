import type Dbpf from "../dbpf";
import { BinaryEncoder } from "../../../utils/encoding";

/**
 * Writes the given DBPF into a buffer.
 * 
 * @param dbpf DBPF model to serialize into a buffer
 */
export default function writeDbpf(dbpf: Dbpf): Buffer {
  const recordsBuffer: Buffer = (() => {
    const buffer = Buffer.alloc(0); // FIXME: find size
    const encoder = new BinaryEncoder(buffer);

    // TODO:

    return buffer;
  })();

  const indexBuffer: Buffer = (() => {
    // each entry is 32 bytes, and flags are 4
    const buffer = Buffer.alloc(dbpf.numEntries() * 32 + 4);
    const encoder = new BinaryEncoder(buffer);

    encoder.uint32(0); // flags will always be null

    dbpf.getEntries().forEach(entry => {
      encoder.uint32(entry.key.type);
      encoder.uint32(entry.key.group);
      // TODO: instance ex
      // TODO: instance
      // TODO: position
      // TODO: size & compressed flag (size | 0x80000000)
      // TODO: size decompressed
      encoder.uint16(23106); // ZLIB compression
      encoder.uint32(1); // committed FIXME: is this always 1?
    });

    return buffer;
  })();

  const headerBuffer: Buffer = (() => {
    const buffer = Buffer.alloc(96);
    const encoder = new BinaryEncoder(buffer);

    encoder.charsUtf8("DBPF");
    encoder.uint32(2); // version major
    encoder.uint32(1); // version minor
    encoder.skip(24); // mnUserVersion through unused2
    encoder.uint32(dbpf.numEntries());
    encoder.uint32(0); // FIXME: what is the low pos?
    encoder.uint32(indexBuffer.length); // index size
    encoder.skip(12); // unused3
    encoder.uint32(3); // unused4
    encoder.uint64(recordsBuffer.length + 96); // index position
    // intentionally ignoring unused5

    return buffer;
  })();

  return Buffer.concat([
    headerBuffer,
    recordsBuffer,
    indexBuffer
  ]);
}