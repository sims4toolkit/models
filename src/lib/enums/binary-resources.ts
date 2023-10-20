import { getAllEnumValues } from "../common/helpers";

/**
 * Types for binary resources (i.e. any resource that follows a BT). Note that
 * this enum is intentionally incomplete, as other binary resources are not yet
 * supported by S4TK.
 */
enum BinaryResourceType {
  // types can be added as necessary
  AnimationStateMachine = 0x02D5DF13,
  CasPart = 0x034AEECB,
  CasPartThumbnail = 0x3C1AF1F2,
  CasPreset = 0xEAA32ADD,
  CombinedTuning = 0x62E94D38,
  DdsImage = 0xB6C8B6A0,
  DstImage = 0x00B2D882,
  Footprint = 0xD382BF57,
  Light = 0x03B4C61D,
  Model = 0x01661233,
  ModelLod = 0x01D10F34,
  NameMap = 0x0166038C,
  ObjectCatalog = 0x319E4F1D,
  ObjectCatalogSet = 0xFF56010C,
  ObjectDefinition = 0xC0DB5AE7,
  OpenTypeFont = 0x25796DCA,
  PngImage = 0x2F7D0004,
  RegionDescription = 0xD65DAFF9,
  RegionMap = 0xAC16FBEC,
  Rle2Image = 0x3453CF95,
  RlesImage = 0xBA856C78,
  Rig = 0x8EAF13DE,
  SimData = 0x545AC67A,
  SimInfo = 0x025ED6F4,
  Slot = 0xD3044521,
  StringTable = 0x220557DA,
  TrayItem = 0x2A8A5E22,
  TrueTypeFont = 0x276CA4B9,
}

namespace BinaryResourceType {
  /**
   * Returns an array of all binary resource types.
   */
  export function all(): BinaryResourceType[] {
    return getAllEnumValues(BinaryResourceType);
  }
}

// `export default enum` not supported by TS
export default BinaryResourceType;
