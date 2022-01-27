/**
 * How resources are encoded.
 */
enum EncodingType {
  Unknown = "Unknown",
  XML = "XML",
  DATA = "DATA",
  STBL = "STBL",
}

// `export default enum` not supported by TS
export default EncodingType;
