/**
 * How resources are encoded.
 */
enum EncodingType {
  Unknown = "Unknown",
  DATA = "DATA",
  OBJDEF = "OBJDEF",
  DDS = "DDS", // DST is a subtype of DDS
  STBL = "STBL",
  XML = "XML",
}

// `export default enum` not supported by TS
export default EncodingType;
