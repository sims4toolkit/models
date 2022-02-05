/**
 * Types of compression used in binary files.
 */
enum CompressionType {
  Uncompressed = 0x0000,
  StreamableCompresssion = 0xFFFE,
  InternalCompression = 0xFFFF,
  DeletedRecord = 0xFFE0,
  ZLIB = 23106
}

export default CompressionType;
