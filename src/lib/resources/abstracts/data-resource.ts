/*
  Adapted from the Sims 4 DATA binary template, provided at the link below.

  https://forums.thesims.com/en_US/discussion/826671/binary-tuning-sim-data-resource-0x545ac67a-and-0x62e94d38
*/

import { BinaryDecoder } from "@s4tk/encoding";
import WritableModel from "../../base/writable-model";
import Resource from "../resource";
import EncodingType from "../../enums/encoding-type";
import DataType from "../../enums/data-type";
import { BinaryFileReadingOptions } from "../../common/options";
import { makeList } from "../../common/helpers";

/**
 * A base for all resource models that follow the DATA binary template.
 */
export default abstract class DataResource extends WritableModel implements Resource {
  static readonly LATEST_VERSION = 0x101;

  readonly encodingType: EncodingType = EncodingType.DATA;

  abstract clone(): DataResource;

  abstract equals(other: any): boolean;

  isXml(): boolean {
    // always false, even though XML representations are possible
    return false;
  }

  /**
   * Returns a bare-bones DTO for DATA resources.
   * 
   * @param buffer Buffer to read as DATA file
   * @param options Options to configure
   */
  protected static _readBinaryDataModel(buffer: Buffer, options?: BinaryFileReadingOptions): BinaryDataResourceDto {
    return readData(buffer, options);
  }
}

//#region Interfaces

export interface NamedBinaryStructure {
  startof_mnNameOffset: number;
  mnNameOffset: number;
  mnNameHash: number;
}

export interface BinaryTableInfo extends NamedBinaryStructure {
  startof_mnSchemaOffset: number; // not in BT
  mnSchemaOffset: number; // int32
  mnDataType: number; // uint32
  mnRowSize: number; // uint32
  startof_mnRowOffset: number; // not in BT
  mnRowOffset: number; // int32
  mnRowCount: number; // uint32
}

export interface BinarySchemaColumn extends NamedBinaryStructure {
  mnDataType: number; // uint16
  mnFlags: number; // uint16
  mnOffset: number; // uint32
  mnSchemaOffset: number; // int32
}

export interface BinarySchema extends NamedBinaryStructure {
  mnSchemaHash: number; // uint32
  mnSchemaSize: number; // uint32
  startof_mnColumnOffset: number; // not in BT
  mnColumnOffset: number; // int32
  mnNumColumns: number; // uint32
  mColumn: BinarySchemaColumn[];
}

export interface BinaryStringTable {
  mStringEntry: string[];
}

export interface BinaryRow {
  [key: string]: any;
}

export interface BinaryTableData {
  mValue?: any[];
  mRow?: BinaryRow[];
}

export interface BinaryDataResourceDto {
  mnVersion: number; // uint32
  mUnused: number; // uint32
  mSchema: BinarySchema[];
  mTable: BinaryTableInfo[];
  mTableData: BinaryTableData[];
  mStringTable: BinaryStringTable;
}

//#endregion Interfaces

//#region Helper Functions

/**
 * Reads a buffer as a DATA file, returning its contents in an object.
 * 
 * @param buffer Buffer to read as a DATA file
 */
function readData(buffer: Buffer, options?: BinaryFileReadingOptions): BinaryDataResourceDto {
  const RELOFFSET_NULL = -0x80000000;

  const decoder = new BinaryDecoder(buffer);

  // Iteration variables
  let i: number, j: number, k: number;

  // Seek to the next byte with alignment given by alignmentMask
  function seekToAlignment(alignmentMask: number) {
    const nCurPos = decoder.tell();
    const nPadAmount = -nCurPos & alignmentMask;
    decoder.seek(nCurPos + nPadAmount);
  }

  function readString(offset: number) {
    return decoder.savePos(() => {
      decoder.seek(offset);
      return decoder.string()
    });
  }

  // Information about each data table.
  function structTableInfo(): BinaryTableInfo {
    return {
      startof_mnNameOffset: decoder.tell(),
      mnNameOffset: decoder.int32(),
      mnNameHash: decoder.uint32(),
      startof_mnSchemaOffset: decoder.tell(),
      mnSchemaOffset: decoder.int32(),
      mnDataType: decoder.uint32(),
      mnRowSize: decoder.uint32(),
      startof_mnRowOffset: decoder.tell(),
      mnRowOffset: decoder.int32(),
      mnRowCount: decoder.uint32()
    }
  }

  // Information about each column in a schema.
  function structSchemaColumn(): BinarySchemaColumn {
    return {
      startof_mnNameOffset: decoder.tell(),
      mnNameOffset: decoder.int32(),
      mnNameHash: decoder.uint32(),
      mnDataType: decoder.uint16(),
      mnFlags: decoder.uint16(),
      mnOffset: decoder.uint32(),
      mnSchemaOffset: decoder.int32()
    }
  }

  // Information about each schema.
  let schemaEndPos: number; // int64
  let lastColumnEndPos: number; // int64
  function structSchema(): BinarySchema {
    const schema: BinarySchema = {
      startof_mnNameOffset: decoder.tell(),
      mnNameOffset: decoder.int32(),
      mnNameHash: decoder.uint32(),
      mnSchemaHash: decoder.uint32(),
      mnSchemaSize: decoder.uint32(),
      startof_mnColumnOffset: decoder.tell(),
      mnColumnOffset: decoder.int32(),
      mnNumColumns: decoder.uint32(),
      mColumn: []
    };

    // Load the schema columns inside the schema.
    schemaEndPos = decoder.tell();

    decoder.seek(schema.startof_mnColumnOffset + schema.mnColumnOffset);
    for (j = 0; j < schema.mnNumColumns; ++j) {
      schema.mColumn.push(structSchemaColumn());
    }

    // Remember the end of the final column.
    lastColumnEndPos = decoder.tell();
    decoder.seek(schemaEndPos);

    return schema;
  }

  function readNamed(named: NamedBinaryStructure): string {
    if (named.mnNameOffset === RELOFFSET_NULL) return "Unnamed";
    return readString(named.startof_mnNameOffset + named.mnNameOffset);
  }

  function structVector2() {
    return {
      x: decoder.float(),
      y: decoder.float()
    }
  }

  function structVector3() {
    return {
      x: decoder.float(),
      y: decoder.float(),
      z: decoder.float()
    }
  }

  function structVector4() {
    return {
      x: decoder.float(),
      y: decoder.float(),
      z: decoder.float(),
      w: decoder.float()
    }
  }

  function structString() {
    return {
      mDataOffset: decoder.uint32()
    }
  }

  function structHashedString() {
    return {
      mDataOffset: decoder.uint32(),
      mHash: decoder.uint32()
    }
  }

  function structLocKey() {
    return {
      mKey: decoder.uint32()
    }
  }

  function structResourceKey() {
    return {
      mInstance: decoder.uint64(),
      mType: decoder.uint32(),
      mGroup: decoder.uint32()
    }
  }

  function structObjectRef() {
    return {
      mDataOffset: decoder.uint32()
    }
  }

  function structTableSetRef() {
    return {
      mValue: decoder.uint64()
    }
  }

  function structVector() {
    return {
      mDataOffset: decoder.uint32(),
      mCount: decoder.uint32()
    }
  }

  function structVariant() {
    return {
      mDataOffset: decoder.int32(),
      mTypeHash: decoder.uint32()
    }
  }

  // Read a single data field with the given type code.
  function readDataType(typeCode: DataType): any {
    switch (typeCode) {
      case DataType.Boolean: return decoder.uint8();
      case DataType.UInt8: return decoder.uint8();
      case DataType.Character: return decoder.charsUtf8(1);
      case DataType.Int8: return decoder.uint8();
      case DataType.Int16: return decoder.int16();
      case DataType.UInt16: return decoder.uint16();
      case DataType.Int32: return decoder.int32();
      case DataType.UInt32: return decoder.uint32();
      case DataType.Int64: return decoder.int64();
      case DataType.UInt64: return decoder.uint64();
      case DataType.Float: return decoder.float();
      case DataType.String: return structString();
      case DataType.HashedString: return structHashedString();
      case DataType.Object: return structObjectRef();
      case DataType.Vector: return structVector();
      case DataType.Float2: return structVector2();
      case DataType.Float3: return structVector3();
      case DataType.Float4: return structVector4();
      case DataType.TableSetReference: return structTableSetRef();
      case DataType.ResourceKey: return structResourceKey();
      case DataType.LocalizationKey: return structLocKey();
      case DataType.Variant: return structVariant();
      case DataType.Undefined:
        throw new Error(`Unknown type code ${typeCode}`);
    }
  }

  const throwErrors = !(options?.recoveryMode);

  // Header
  const mnFileIdentifier = decoder.charsUtf8(4);
  if (throwErrors && mnFileIdentifier !== "DATA")
    throw new Error("Not a SimData file (must begin with \"DATA\").");
  const mnVersion = decoder.uint32();
  if (throwErrors && mnVersion < 0x100 || mnVersion > 0x101)
    throw new Error("Unknown version (must be 0x100 or 0x101).");

  // Offset of table header data
  const nTableHeaderPos = decoder.tell();
  const mnTableHeaderOffset = decoder.int32();

  // Number of table headers
  const mnNumTables = decoder.int32();

  // Offset of schema data
  const nSchemaPos = decoder.tell();
  const mnSchemaOffset = decoder.int32();

  // Number of schemas
  const mnNumSchemas = decoder.int32();

  // Not used, should either be 0, 0xFFFFFFFF, or match pack number
  const mUnused = mnVersion >= 0x101 ? decoder.uint32() : undefined;

  // Skip to the beginning of the table header block
  decoder.seek(nTableHeaderPos + mnTableHeaderOffset);

  // Load the tables
  const mTable = makeList(mnNumTables, structTableInfo);

  // We need to read schemas before we can load data, so
  // just remember the position at which row data starts.
  const rowDataPos = decoder.tell();

  // Read schemas.  Because schemas are variable-sized,
  // and reading them is complex, we cannot use the
  // array syntax (even with <optimize=false>).
  decoder.seek(nSchemaPos + mnSchemaOffset);
  let mSchema: BinarySchema[] = [];
  for (i = 0; i < mnNumSchemas; ++i) {
    mSchema.push(structSchema());
  }

  // Get the schema with the given offset
  function getSchemaIndex(offset: number): number {
    for (let i = 0; i < mnNumSchemas; ++i) {
      if (offset === mSchema[i].startof_mnNameOffset) {
        return i;
      }
    }

    throw new Error(`Unknown schema offset ${offset}`);
  }

  // Now, jump past the columns that were read above.
  decoder.seek(lastColumnEndPos);

  // Read the string table, which consists of NULL separated
  // UTF-8 encoded strings, and comprises the rest of the file.
  function structStringTable(): BinaryStringTable {
    const mStringEntry: string[] = [];
    while (!decoder.isEOF()) {
      mStringEntry.push(decoder.string());
    }
    return { mStringEntry };
  }
  const mStringTable = structStringTable();

  // Now, we can jump back and read data.  Note that the start of the
  // row data must be aligned (mask == 15).
  decoder.seek(rowDataPos);

  let schemaIndex: number;
  let alignment: number, columnAlignment: number;
  let rowStart: number;
  let schemaColumnName: string;
  const mTableData: BinaryTableData[] = [];
  for (i = 0; i < mnNumTables; ++i) {
    seekToAlignment(15);
    seekToAlignment(mTable[i].mnRowSize - 1);

    const tableData: BinaryTableData = {};
    if (mTable[i].mnSchemaOffset === RELOFFSET_NULL) {
      tableData.mValue = [];
    } else {
      tableData.mRow = [];
    }

    function structTableData(): BinaryTableData {
      alignment = 1;
      for (j = 0; j < mTable[i].mnRowCount; ++j) {
        // Some tables have no schema; these support only one
        // data type.
        if (mTable[i].mnSchemaOffset === RELOFFSET_NULL) {
          tableData.mValue.push(readDataType(mTable[i].mnDataType));
          alignment = DataType.getAlignment(mTable[i].mnDataType);
        } else {
          schemaIndex = getSchemaIndex(mTable[i].startof_mnSchemaOffset + mTable[i].mnSchemaOffset);
          function structRow(): BinaryRow {
            // Read each column.  The order of column data does not match the column
            // order (columns are sorted by name hash).
            const row: BinaryRow = {};
            for (k = 0; k < mSchema[schemaIndex].mnNumColumns; ++k) {
              schemaColumnName = readNamed(mSchema[schemaIndex].mColumn[k]);
              decoder.seek(rowStart + mSchema[schemaIndex].mColumn[k].mnOffset);
              row[schemaColumnName] = readDataType(mSchema[schemaIndex].mColumn[k].mnDataType);
              columnAlignment = DataType.getAlignment(mTable[i].mnDataType);
              if (columnAlignment > alignment)
                alignment = columnAlignment;
            }
            return row;
          }

          // Reading the rows will modify the file position.  We need to save the current row start
          // and then manually increment the position after loading the column data.
          rowStart = decoder.tell();
          tableData.mRow.push(structRow());
          decoder.seek(rowStart + mSchema[schemaIndex].mnSchemaSize);
        }
        seekToAlignment(alignment - 1);
      }
      return tableData;
    }
    mTableData.push(structTableData());
    seekToAlignment(15);
  }

  return {
    mnVersion,
    mUnused,
    mSchema,
    mTable,
    mTableData,
    mStringTable,
  }
}

//#endregion Helper Functions
