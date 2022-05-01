import { BinaryDecoder } from "@s4tk/encoding";
import type { BinaryFileReadingOptions } from "../../../common/options";
import type { ObjectCellRow, SimDataDto } from "../types";
import { makeList } from "../../../common/helpers";
import { SimDataSchema, SimDataSchemaColumn, SimDataInstance } from "../fragments";
import * as cells from "../cells";
import DataType, { SimDataRecursiveType } from "../../../enums/data-type";
import type { BinaryDataResourceDto, BinarySchema, BinaryTableInfo } from "../../abstracts/data-resource";

//#region Constants

const RELOFFSET_NULL = -0x80000000;

//#endregion Constants

/**
 * Converts a binary DATA model into one using instances.
 * 
 * @param binaryModel Model containing data from the binary DATA file
 * @param buffer Original buffer containing data
 * @param options Options for reading the buffer
 */
export default function readSimData(binaryModel: BinaryDataResourceDto, buffer: Buffer, options?: BinaryFileReadingOptions): SimDataDto {
  const decoder = new BinaryDecoder(buffer);

  //#region General Helpers

  function getBinarySchema(offset: number): BinarySchema {
    const index = binaryModel.mSchema.findIndex(schema => offset === schema.startof_mnNameOffset);
    if (index >= 0) return binaryModel.mSchema[index];
    return undefined;
  }

  function getBinaryTableInfo(position: number): BinaryTableInfo {
    if (position === RELOFFSET_NULL) return undefined;

    const tableInfo = binaryModel.mTable.find(tableInfo => {
      const start = tableInfo.startof_mnRowOffset + tableInfo.mnRowOffset;
      const end = start + (tableInfo.mnRowSize * tableInfo.mnRowCount) - 1;
      return position >= start && position <= end;
    });

    if (tableInfo === undefined)
      throw new Error(`Position ${position} is not located in a TableData.`);

    return tableInfo;
  }

  //#endregion General Helpers

  //#region Cell Helpers

  function readVariantCell(typeHash: number, tableInfo: BinaryTableInfo): cells.VariantCell {
    const dataType = tableInfo.mnDataType;

    // objs are different, because variants point directly to their data
    const childCell: cells.Cell = (dataType === DataType.Object) ?
      readObjectCell(getBinaryTableInfo(decoder.tell())) :
      readCell(dataType);

    return new cells.VariantCell(typeHash, childCell);
  }

  function readVectorCell(count: number, tableInfo: BinaryTableInfo): cells.VectorCell {
    const childType = tableInfo.mnDataType;

    // objs are different, because vectors point directly to their data
    const childGenFn: () => cells.Cell = childType === DataType.Object
      ? (() => {
        const childTableInfo = getBinaryTableInfo(decoder.tell());
        return () => readObjectCell(childTableInfo);
      })()
      : () => readCell(childType);

    return new cells.VectorCell(makeList(count, childGenFn));
  }

  function readObjectCell(tableInfo: BinaryTableInfo): cells.ObjectCell {
    const binarySchema = getBinarySchema(tableInfo.startof_mnSchemaOffset + tableInfo.mnSchemaOffset);
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
    const tableInfo = getBinaryTableInfo(dataPos);

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

  const schemas: SimDataSchema[] = binaryModel.mSchema.map(binarySchema => {
    return new SimDataSchema(
      binarySchema.name,
      binarySchema.mnSchemaHash,
      binarySchema.mColumn.map(binaryColumn => {
        return new SimDataSchemaColumn(
          binaryColumn.name,
          binaryColumn.mnDataType,
          binaryColumn.mnFlags
        );
      }));
  });

  const instances: SimDataInstance[] = [];
  binaryModel.mTable.forEach(tableInfo => {
    if (tableInfo.name) {
      decoder.seek(tableInfo.startof_mnRowOffset + tableInfo.mnRowOffset);

      instances.push(SimDataInstance.fromObjectCell(
        tableInfo.name,
        readObjectCell(tableInfo)
      ));
    }
  });

  //#endregion Main Content

  return {
    version: binaryModel.mnVersion,
    unused: binaryModel.mUnused,
    schemas,
    instances
  };
}
