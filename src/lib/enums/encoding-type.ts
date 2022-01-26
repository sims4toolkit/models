/**
 * Types for binary resources (i.e. any resource that follows a BT).
 */
enum EncodingType {
  Unknown = "Unknown",
  XML = "XML",
  DATA = "DATA",
  STBL = "STBL",
}

// `export default enum` not supported by TS
export default EncodingType;
