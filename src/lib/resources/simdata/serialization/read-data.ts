import type { FileReadingOptions } from "../../../common/options";
import type { ObjectCellRow, SimDataDto } from "../types";
import { BinaryDecoder } from "@s4tk/encoding";
import { makeList } from "../../../common/helpers";
import { SimDataSchema, SimDataSchemaColumn, SimDataInstance } from "../fragments";
import * as cells from "../cells";
import { RELOFFSET_NULL } from "../constants";
import DataType, { SimDataRecursiveType } from "../../../enums/data-type";

//#region Interfaces

interface HasNameOffset {
  startof_mnNameOffset: number; // not in BT
  mnNameOffset: number; // int32
  mnNameHash: number; // uint32
  name?: string; // not in BT
}

interface BinaryTableInfo extends HasNameOffset {
  startof_mnSchemaOffset: number; // not in BT
  mnSchemaOffset: number; // int32
  mnDataType: number; // uint32
  mnRowSize: number; // uint32
  startof_mnRowOffset: number; // not in BT
  mnRowOffset: number; // int32
  mnRowCount: number; // uint32
}

interface BinarySchemaColumn extends HasNameOffset {
  mnDataType: number; // uint16
  mnFlags: number; // uint16
  mnOffset: number; // uint32
  mnSchemaOffset: number; // int32
}

interface BinarySchema extends HasNameOffset {
  mnSchemaHash: number; // uint32
  mnSchemaSize: number; // uint32
  startof_mnColumnOffset: number; // not in BT
  mnColumnOffset: number; // int32
  mnNumColumns: number; // uint32
  mColumn: BinarySchemaColumn[];
}

//#endregion Interfaces

//#region General Helpers

/**
 * Gets the name of the given object from the given decoder.
 * 
 * @param decoder Decoder to get name from
 * @param named Object to get name for
 */
function getName(decoder: BinaryDecoder, named: HasNameOffset): string {
  if (named.mnNameOffset === RELOFFSET_NULL) return undefined;
  decoder.seek(named.startof_mnNameOffset + named.mnNameOffset);
  return decoder.string();
}

/**
 * Finds and returns the binary schema at the given offset.
 * 
 * @param mSchema All binary schemas
 * @param offset Offset of schema to find
 */
function getBinarySchema(mSchema: BinarySchema[], offset: number): BinarySchema {
  const index = mSchema.findIndex(schema => offset === schema.startof_mnNameOffset);
  if (index >= 0) return mSchema[index];
  console.warn(`Unknown schema offset ${offset}`);
  return undefined;
}

/**
 * Finds and returns the binary table info at the given offset.
 * 
 * @param mTable All binary table
 * @param position Position of table to find
 */
function getTableInfo(mTable: BinaryTableInfo[], position: number): BinaryTableInfo {
  if (position === RELOFFSET_NULL) return undefined;

  const tableInfo = mTable.find(tableInfo => {
    const start = tableInfo.startof_mnRowOffset + tableInfo.mnRowOffset;
    const end = start + (tableInfo.mnRowSize * tableInfo.mnRowCount) - 1;
    return position >= start && position <= end;
  });

  if (tableInfo === undefined)
    throw new Error(`Position ${position} is not located in a TableData.`);
  
  return tableInfo;
}

//#endregion General Helpers

//#region Struct Helpers

/**
 * Reads and returns a BinaryTableInfo from the given decoder.
 * 
 * @param decoder Decoder to read table info from
 */
function readTableInfo(decoder: BinaryDecoder): BinaryTableInfo {
  const ti: BinaryTableInfo = {
    startof_mnNameOffset: decoder.tell(),
    mnNameOffset: decoder.int32(),
    mnNameHash: decoder.uint32(),
    startof_mnSchemaOffset: decoder.tell(),
    mnSchemaOffset: decoder.int32(),
    mnDataType: decoder.uint32(),
    mnRowSize: decoder.uint32(),
    startof_mnRowOffset: decoder.tell(),
    mnRowOffset: decoder.int32(),
    mnRowCount: decoder.uint32(),
  };

  ti.name = decoder.savePos<string>(() => getName(decoder, ti));
  return ti;
}

/**
 * Reads and returns a BinarySchemaColumn from the given decoder.
 * 
 * @param decoder Decoder to read column from
 */
function readSchemaColumn(decoder: BinaryDecoder): BinarySchemaColumn {
  const sc: BinarySchemaColumn = {
    startof_mnNameOffset: decoder.tell(),
    mnNameOffset: decoder.int32(),
    mnNameHash: decoder.uint32(),
    mnDataType: decoder.uint16(),
    mnFlags: decoder.uint16(),
    mnOffset: decoder.uint32(),
    mnSchemaOffset: decoder.int32()
  };

  sc.name = decoder.savePos<string>(() => getName(decoder, sc));
  return sc;
}

/**
 * Reads and returns a BinarySchema from the given decoder.
 * 
 * @param decoder Decoder to read schema from
 */
function readSchema(decoder: BinaryDecoder): BinarySchema {
  const startof_mnNameOffset = decoder.tell();
  const mnNameOffset = decoder.int32();
  const mnNameHash = decoder.uint32();
  const mnSchemaHash = decoder.uint32();
  const mnSchemaSize = decoder.uint32();
  const startof_mnColumnOffset = decoder.tell();
  const mnColumnOffset = decoder.int32();
  const mnNumColumns = decoder.uint32();

  let schema: BinarySchema;
  decoder.savePos(() => {
    decoder.seek(startof_mnColumnOffset + mnColumnOffset);
    const mColumn = makeList<BinarySchemaColumn>(mnNumColumns, () => readSchemaColumn(decoder));
    schema = {
      startof_mnNameOffset,
      mnNameOffset,
      mnNameHash,
      mnSchemaHash,
      mnSchemaSize,
      startof_mnColumnOffset,
      mnColumnOffset,
      mnNumColumns,
      mColumn
    };

    schema.name = getName(decoder, schema);
  });

  return schema;
}

//#endregion Struct Helpers

/**
 * Reads a binary DATA file in a buffer as a SimData.
 * 
 * @param buffer Buffer to read
 * @param options Options for reading
 */
export default function readData(buffer: Buffer, options?: FileReadingOptions): SimDataDto {
  const decoder = new BinaryDecoder(buffer);
  const throwErrors = options === undefined || !options.ignoreErrors;

  //#region Cell Helpers

  function readVariantCell(typeHash: number, tableInfo: BinaryTableInfo): cells.VariantCell {
    const dataType = tableInfo.mnDataType;

    // objs are different, because variants point directly to their data
    const childCell: cells.Cell = (dataType === DataType.Object) ?
      readObjectCell(getTableInfo(mTable, decoder.tell())) :
      readCell(dataType);
    
    return new cells.VariantCell(typeHash, childCell);
  }

  function readVectorCell(count: number, tableInfo: BinaryTableInfo): cells.VectorCell {
    const childType = tableInfo.mnDataType;

    // objs are different, because vectors point directly to their data
    const childGenFn: () => cells.Cell = childType === DataType.Object ?
      (() => {
        const childTableInfo = getTableInfo(mTable, decoder.tell());
        return () => readObjectCell(childTableInfo);
      })() :
      () => readCell(childType);

    return new cells.VectorCell(makeList(count, childGenFn));
  }

  function readObjectCell(tableInfo: BinaryTableInfo): cells.ObjectCell {
    const binarySchema = getBinarySchema(mSchema, tableInfo.startof_mnSchemaOffset + tableInfo.mnSchemaOffset);
    const schema = schemas.find(schema => schema.hash === binarySchema.mnSchemaHash);

    const row: ObjectCellRow = {};
    binarySchema.mColumn.forEach(column => {
      decoder.savePos(() => {
        decoder.skip(column.mnOffset);
        row[column.name] = readCell(column.mnDataType);
      });
    });

    decoder.skip(binarySchema.mnSchemaSize);
    return new cells.ObjectCell(schema, row);
  }

  function readCellFromPointer(dataType: SimDataRecursiveType): cells.Cell {
    // BT uses uint32 for offset of object and vector, but I'm intentionally
    // using an int32 because the value CAN be negative (variant is signed,
    // it's a newer data type, introduced in 0x101)
    const startPos = decoder.tell();
    const dataOffset = decoder.int32();
    const dataPos = dataOffset === RELOFFSET_NULL ? dataOffset : startPos + dataOffset;
    const tableInfo = getTableInfo(mTable, dataPos);

    switch (dataType) {
      case DataType.Object:
        if (dataOffset === RELOFFSET_NULL)
          throw new Error("Object cell does not have any data defined.");
        return decoder.savePos<cells.ObjectCell>(() => {
          decoder.seek(dataPos);
          return readObjectCell(tableInfo);
        });
      case DataType.Vector:
        const count = decoder.uint32();
        if (dataOffset === RELOFFSET_NULL || count === 0)
          return new cells.VectorCell<cells.Cell>([]);
        return decoder.savePos<cells.VectorCell<cells.Cell>>(() => {
          decoder.seek(dataPos);
          return readVectorCell(count, tableInfo);
        });
      case DataType.Variant:
        const typeHash = decoder.uint32();
        if (dataOffset === RELOFFSET_NULL)
          return new cells.VariantCell(typeHash, undefined);
        return decoder.savePos<cells.VariantCell>(() => {
          decoder.seek(dataPos);
          return readVariantCell(typeHash, tableInfo);
        });
      default:
        throw new Error(`Cannot read pointer for ${dataType}`);
    }
  }

  function readCell(dataType: DataType): cells.Cell {
    switch (dataType) {
      case DataType.Boolean:
        return cells.BooleanCell.decode(decoder);
      case DataType.Character:
      case DataType.String:
      case DataType.HashedString:
        return cells.TextCell.decode(dataType, decoder);
      case DataType.Int8:
      case DataType.UInt8:
      case DataType.Int16:
      case DataType.UInt16:
      case DataType.Int32:
      case DataType.UInt32:
      case DataType.Float:
      case DataType.LocalizationKey:
        return cells.NumberCell.decode(dataType, decoder);
      case DataType.Int64:
      case DataType.UInt64:
      case DataType.TableSetReference:
        return cells.BigIntCell.decode(dataType, decoder);
      case DataType.Float2:
        return cells.Float2Cell.decode(decoder);
      case DataType.Float3:
        return cells.Float3Cell.decode(decoder);
      case DataType.Float4:
        return cells.Float4Cell.decode(decoder);
      case DataType.ResourceKey:
        return cells.ResourceKeyCell.decode(decoder);
      case DataType.Undefined:
        throw new Error(`Cannot get value for data type ${dataType}`);
      default: 
        return readCellFromPointer(dataType);
    }
  }

  //#endregion Cell Helpers

  //#region Main Content

  // Header and binary info
  const mnFileIdentifier = decoder.charsUtf8(4);
  if (throwErrors && mnFileIdentifier !== "DATA")
    throw new Error("Not a SimData file (must begin with \"DATA\").");
  const mnVersion = decoder.uint32();
  if (throwErrors && mnVersion < 0x100 || mnVersion > 0x101)
    throw new Error("Unknown version (must be 0x100 or 0x101).");
  const nTableHeaderPos = decoder.tell();
  const mnTableHeaderOffset = decoder.int32();
  const mnNumTables = decoder.int32();
  const nSchemaPos = decoder.tell(); // BT has int64 here
  const mnSchemaOffset = decoder.int32();
  const mnNumSchemas = decoder.int32();
  const mUnused = mnVersion >= 0x101 ? decoder.uint32() : undefined;
  decoder.seek(nTableHeaderPos + mnTableHeaderOffset);
  const mTable = makeList<BinaryTableInfo>(mnNumTables, () => readTableInfo(decoder));
  decoder.seek(nSchemaPos + mnSchemaOffset);
  const mSchema = makeList<BinarySchema>(mnNumSchemas, () => readSchema(decoder));

  // Converting schemas
  const schemas: SimDataSchema[] = mSchema.map(binarySchema => {
    return new SimDataSchema(
      binarySchema.name,
      binarySchema.mnSchemaHash,
      binarySchema.mColumn.map(binaryColumn => {
        return new SimDataSchemaColumn(
          binaryColumn.name,
          binaryColumn.mnDataType,
          binaryColumn.mnFlags
        );
      }))
  });

  // Parsing instances
  const instances: SimDataInstance[] = [];
  mTable.forEach(tableInfo => {
    if (tableInfo.name !== undefined) {
      decoder.seek(tableInfo.startof_mnRowOffset + tableInfo.mnRowOffset);

      instances.push(SimDataInstance.fromObjectCell(
        tableInfo.name,
        readObjectCell(tableInfo)
      ));
    }
  });

  //#endregion Main Content

  return {
    version: mnVersion,
    unused: mUnused,
    schemas,
    instances
  };
}
