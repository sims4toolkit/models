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

export type SimDataText =
  SimDataType.Character |
  SimDataType.String |
  SimDataType.HashedString;

export type SimDataFloatVector =
  SimDataType.Float2 |
  SimDataType.Float3 |
  SimDataType.Float4;


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
  export function getBytes(dataType: SimDataType): number {
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

  /**
   * Verifies that the given value is within the range for the give type.
   * 
   * @param value Value to verify
   * @param dataType Data type to determine range for
   */
  export function isNumberInRange(value: number, dataType: SimDataNumber): boolean {
    switch (dataType) {
      case SimDataType.Int8:
        return value >= -0x80 && value <= 0x7F;
      case SimDataType.UInt8:
        return value >= 0 && value <= 0xFF;
      case SimDataType.Int16:
        return value >= -0x80000 && value <= 0x7FFF;
      case SimDataType.UInt16:
        return value >= 0 && value <= 0xFFFF;
      case SimDataType.Int32:
        return value >= -0x800000000 && value <= 0x7FFFFFFF;
      case SimDataType.LocalizationKey:
        // fallthrough
      case SimDataType.UInt32:
        return value >= 0 && value <= 0xFFFFFFFF;
      case SimDataType.Float:
        return true; // FIXME: find limits
      default:
        throw new Error(`Type ${dataType} is not a SimDataNumber.`);
    }
  }

  /**
   * Verifies that the given value is within the range for the give type.
   * 
   * @param value Value to verify
   * @param dataType Data type to determine range for
   */
  export function isBigIntInRange(value: bigint, dataType: SimDataBigInt): boolean {
    switch (dataType) {
      case SimDataType.Int64:
        return value >= -0x8000000000000000n && value <= 0x7FFFFFFFFFFFFFFFn;
      case SimDataType.TableSetReference:
        // fallthrough
      case SimDataType.UInt64:
        return value >= 0 && value <= 0xFFFFFFFFFFFFFFFFn;
      default:
        throw new Error(`Type ${dataType} is not a SimDataBigInt.`);
    }
  }
}
