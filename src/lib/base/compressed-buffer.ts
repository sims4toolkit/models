import type { CompressionType } from "@s4tk/compression";

/**
 * Wrapper for a buffer that is compressed in one of the supported formats.
 */
export default interface CompressedBufferWrapper {
  /** The buffer. */
  readonly buffer: Buffer;

  /** How the buffer is compressed. */
  readonly compressionType: CompressionType;

  /** The byte size of the buffer when decompressed. */
  readonly sizeDecompressed: number;
}
