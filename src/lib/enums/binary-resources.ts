import { getAllEnumValues } from "../common/helpers";

/**
 * Types for binary resources (i.e. any resource that follows a BT). Note that
 * this enum is intentionally incomplete, as other binary resources are not yet
 * supported by S4TK.
 */
enum BinaryResourceType {
  // Some types will be added in comments as I come across them, but they will
  // only become part of the actual enum when/if they have a model implemented
  CombinedTuning = 0x62E94D38,
  DdsImage = 0xB6C8B6A0,
  DstImage = 0x00B2D882,
  // Footprint = 0xD382BF57,
  // Light = 0x03B4C61D,
  // ModelLod = 0x01D10F34,
  // ObjectCatalog = 0x319E4F1D,
  ObjectDefinition = 0xC0DB5AE7,
  // Rig = 0x8EAF13DE,
  SimData = 0x545AC67A,
  // Slot = 0xD3044521,
  StringTable = 0x220557DA,
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
