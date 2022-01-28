/**
 * Types of data that can be stored in a DATA file. The order of these values
 * 100% matters, do NOT change them - they match the BT.
 */
enum DataType {
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

/** Data types that are 32-bit (or less) numbers. */
export type SimDataNumber = 
  DataType.Int8 |
  DataType.UInt8 |
  DataType.Int16 |
  DataType.UInt16 |
  DataType.Int32 |
  DataType.UInt32 |
  DataType.Float |
  DataType.LocalizationKey;

/** Data types that are 64-bit numbers. */
export type SimDataBigInt = 
  DataType.Int64 |
  DataType.UInt64 |
  DataType.TableSetReference;

/** Data types that can be stored in a string. */
export type SimDataText =
  DataType.Character |
  DataType.String |
  DataType.HashedString;

/** Data types that consist of a set number of floats. */
export type SimDataFloatVector =
  DataType.Float2 |
  DataType.Float3 |
  DataType.Float4;

/** Data types that contain primitives/non-recursive value. */
export type SimDataPrimitiveType =
  SimDataNumber |
  SimDataBigInt |
  SimDataText |
  SimDataFloatVector |
  DataType.Boolean |
  DataType.ResourceKey;

/** Data types that contain recursive values. */
export type SimDataRecursiveType =
  DataType.Object |
  DataType.Variant |
  DataType.Vector;

namespace DataType {
  /**
   * Returns the alignment for the given DataType.
   * 
   * @param dataType The DataType to get the alignment for
   */
  export function getAlignment(dataType: DataType): number {
    switch (dataType) {
      case DataType.Boolean:
      case DataType.Character:
      case DataType.Int8:
      case DataType.UInt8:
        return 1;
      case DataType.Int16:
      case DataType.UInt16:
        return 2;
      case DataType.Int32:
      case DataType.UInt32:
      case DataType.Float:
      case DataType.String:
      case DataType.HashedString:
      case DataType.Object:
      case DataType.Vector:
      case DataType.Float2:
      case DataType.Float3:
      case DataType.Float4:
      case DataType.LocalizationKey:
      case DataType.Variant:
        return 4;
      case DataType.Int64:
      case DataType.UInt64:
      case DataType.TableSetReference:
      case DataType.ResourceKey:
        return 8;
      default:
        return 1;
    }
  }

  /**
   * Returns the number of bytes used by the given DataType.
   * 
   * @param dataType The DataType to get the number of bytes for
   */
  export function getBytes(dataType: DataType): number {
    switch (dataType) {
      case DataType.Boolean:
      case DataType.Character:
      case DataType.Int8:
      case DataType.UInt8:
        return 1;
      case DataType.Int16:
      case DataType.UInt16:
        return 2;
      case DataType.Int32:
      case DataType.UInt32:
      case DataType.Float:
      case DataType.String:
      case DataType.Object:
      case DataType.LocalizationKey:
        return 4;
      case DataType.Int64:
      case DataType.UInt64:
      case DataType.HashedString:
      case DataType.Vector:
      case DataType.Float2:
      case DataType.TableSetReference:
      case DataType.Variant:
        return 8;
      case DataType.Float3:
        return 12;
      case DataType.Float4:
      case DataType.ResourceKey:
        return 16;
      default:
        throw new Error(`DataType ${dataType} not recognized.`);
    }
  }

  /**
   * Gets the name to use for the given DataType in S4S-style XML.
   * 
   * @param dataType DataType to get the S4S name of
   */
  export function getSims4StudioName(dataType: DataType): string {
    switch (dataType) {
      case DataType.Character:
        throw new Error(`Character values cannot be represented in S4S XML. If you are reading this error, please let me know about it ASAP (https://github.com/sims4toolkit/models/issues).`);
      case DataType.Float: return "Single";
      default:
        return DataType[dataType];
    }
  }

  /**
   * Gets the data type associated with the given S4S XML type name.
   * 
   * @param name Name of data type as it appears in S4S XML
   */
  export function parseSims4StudioName(name: string): DataType {
    if (name === "Single") return DataType.Float;
    return DataType[name];
  }

  /**
   * Verifies that the given value is within the range for the give type.
   * 
   * @param value Value to verify
   * @param dataType Data type to determine range for
   */
  export function isNumberInRange(value: number, dataType: SimDataNumber): boolean {
    if (value == undefined || Number.isNaN(value)) return false;

    switch (dataType) {
      case DataType.Int8:
        return value >= -0x80 && value <= 0x7F;
      case DataType.UInt8:
        return value >= 0 && value <= 0xFF;
      case DataType.Int16:
        return value >= -0x80000 && value <= 0x7FFF;
      case DataType.UInt16:
        return value >= 0 && value <= 0xFFFF;
      case DataType.Int32:
        return value >= -0x800000000 && value <= 0x7FFFFFFF;
      case DataType.LocalizationKey:
        // fallthrough
      case DataType.UInt32:
        return value >= 0 && value <= 0xFFFFFFFF;
      case DataType.Float:
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
    if (value == undefined) return false;
    
    switch (dataType) {
      case DataType.Int64:
        return value >= -0x8000000000000000n && value <= 0x7FFFFFFFFFFFFFFFn;
      case DataType.TableSetReference:
        // fallthrough
      case DataType.UInt64:
        return value >= 0n && value <= 0xFFFFFFFFFFFFFFFFn;
      default:
        throw new Error(`Type ${dataType} is not a SimDataBigInt.`);
    }
  }

  /**
   * Parses a number from the given value using the given type. The parsed
   * number is NOT guaranteed to fit within the bounds of the given type; it
   * is just used to determine the base system to use, and whether it is parsing
   * an integer or float.
   * 
   * If the value is `undefined` or `null`, a value of `0` is returned.
   * 
   * If no number can be parsed, `NaN` is returned.
   * 
   * @param value Value to parse as a number
   * @param dataType Data type to parse value as
   */
  export function parseNumber(value: any, dataType: SimDataNumber): number {
    value = value ?? 0;

    if (typeof value === 'number') {
      return value; // includes NaN
    } else if (typeof value === 'string') {
      return dataType === DataType.Float ? parseFloat(value) : parseInt(value);
    } else {
      return NaN;
    }
  }

}

export default DataType;
