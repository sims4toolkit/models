/**
 * Types for binary resources (i.e. any resource that follows a BT).
 */
enum BinaryResourceType {
  CombinedBinaryTuning = 0x62E94D38,
  DstImage = 0x00B2D882,
  SimData = 0x545AC67A,
  StringTable = 0x220557DA,
}

// `export default enum` not supported by TS
export default BinaryResourceType;
