/**
 * Types of data that can be stored in a DATA file. The order of these values
 * 100% matters, do NOT change them - they match the BT.
 */
export enum SimDataType {
  Boolean, // 0
  Character, // 1
  Int8, // 2
  UInt8, // 3
  Int16, // 4
  UInt16, // 5
  Int32, // 6
  UInt32, // 7
  Int64, // 8
  UInt64, // 9
  Float, // 10
  String, // 11
  HashedString, // 12
  Object, // 13
  Vector, // 14
  Float2, // 15
  Float3, // 16
  Float4,  // 17
  TableSetReference, // 18
  ResourceKey, // 19
  LocalizationKey, // 20
  Variant, // 21
  Undefined // 22
}

export type SimDataNumber = 
  SimDataType.Int8 |
  SimDataType.UInt8 |
  SimDataType.Int16 |
  SimDataType.UInt16 |
  SimDataType.Int32 |
  SimDataType.UInt32 |
  SimDataType.Float |
  SimDataType.LocalizationKey;

export type SimDataBigInt = 
  SimDataType.Int64 |
  SimDataType.UInt64 |
  SimDataType.TableSetReference;

export type SimDataString =
  SimDataType.Character |
  SimDataType.String |
  SimDataType.HashedString;

/**
 * Namespace that contains helper functions for SimDataTypes.
 */
export namespace SimDataTypeUtils {
  /**
   * Returns the alignment for the given SimDataType.
   * 
   * @param dataType The SimDataType to get the alignment for
   */
  export function getAlignment(dataType: SimDataType): number {
    switch (dataType) {
      case SimDataType.Boolean:
      case SimDataType.Character:
      case SimDataType.Int8:
      case SimDataType.UInt8:
        return 1;
      case SimDataType.Int16:
      case SimDataType.UInt16:
        return 2;
      case SimDataType.Int32:
      case SimDataType.UInt32:
      case SimDataType.Float:
      case SimDataType.String:
      case SimDataType.HashedString:
      case SimDataType.Object:
      case SimDataType.Vector:
      case SimDataType.Float2:
      case SimDataType.Float3:
      case SimDataType.Float4:
      case SimDataType.LocalizationKey:
      case SimDataType.Variant:
        return 4;
      case SimDataType.Int64:
      case SimDataType.UInt64:
      case SimDataType.TableSetReference:
      case SimDataType.ResourceKey:
        return 8;
      default:
        return 1;
    }
  }

  /**
   * Returns the number of bytes used by the given SimDataType.
   * 
   * @param dataType The SimDataType to get the number of bytes for
   */
  function getBytes(dataType: SimDataType): number {
    switch (dataType) {
      case SimDataType.Boolean:
      case SimDataType.Character:
      case SimDataType.Int8:
      case SimDataType.UInt8:
        return 1;
      case SimDataType.Int16:
      case SimDataType.UInt16:
        return 2;
      case SimDataType.Int32:
      case SimDataType.UInt32:
      case SimDataType.Float:
      case SimDataType.String:
      case SimDataType.Object:
      case SimDataType.LocalizationKey:
        return 4;
      case SimDataType.Int64:
      case SimDataType.UInt64:
      case SimDataType.HashedString:
      case SimDataType.Vector:
      case SimDataType.Float2:
      case SimDataType.TableSetReference:
      case SimDataType.Variant:
        return 8;
      case SimDataType.Float3:
        return 12;
      case SimDataType.Float4:
      case SimDataType.ResourceKey:
        return 16;
      default:
        throw new Error(`DataType ${dataType} not recognized.`);
    }
  }
}
