import { deflateSync } from "zlib";
import CompressionType from "./compression-type";

/**
 * Compresses the given buffer using the giving algorithm.
 * 
 * @param buffer Buffer to compress
 * @param compression Compression algorithm to use
 */
export default function compressBuffer(buffer: Buffer, compression: CompressionType): Buffer {
  switch (compression) {
    case CompressionType.Uncompressed:
      return buffer;
    case CompressionType.ZLIB:
      return deflateSync(buffer);
    default:
      throw new Error(`Compressing with "${CompressionType[compression]}" is not supported.`);
  }
}
