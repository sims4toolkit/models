/**
 * Types for binary resources (i.e. any resource that follows a BT). Note that
 * this enum is intentionally incomplete, as other binary resources are not yet
 * supported by S4TK.
 */
enum BinaryResourceType {
  CombinedTuning = 0x62E94D38,
  DdsImage = 0xB6C8B6A0,
  DstImage = 0x00B2D882,
  SimData = 0x545AC67A,
  StringTable = 0x220557DA,
}

// `export default enum` not supported by TS
export default BinaryResourceType;
