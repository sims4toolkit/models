import { BinaryEncoder } from "../../../../utils/encoding";
import { formatAsHexString } from "../../../../utils/formatting";
import { fnv32 } from "../../../../utils/hashing";
import { SimDataDto, HEADER_SIZE, TABLE_HEADER_OFFSET, RELOFFSET_NULL, NO_NAME_HASH, SUPPORTED_VERSION } from "../shared";
import { SimDataType, SimDataTypeUtils } from "../simDataTypes";
import * as cells from "../cells";

// FIXME: there could potentially be an issue with padding when writing booleans,
// for an example use the scenario role that chip sent

/**
 * Writes a SimData model as a binary DATA file.
 * 
 * @param model SimData model to write
 */
export default function writeData(model: SimDataDto): Buffer {
  if (model.version !== SUPPORTED_VERSION) {
    const hexVersion = formatAsHexString(model.version, 0, true);
    const hexSupVersion = formatAsHexString(SUPPORTED_VERSION, 0, true);
    throw new Error(`S4TK cannot write SimData version ${hexVersion}, only ${hexSupVersion} is supported at this time.`);
  }

  //#region Interfaces

  interface SerialSchema {
    name: string; // what mnNameOffset points to
    hash: number; // mnSchemaHash
    size: number; // mnSchemaSize
    columns: SerialColumn[]; // mColumn
  }

  interface SerialColumn {
    name: string; // what mnNameOffset points to
    dataType: SimDataType; // mnDataType
    offset: number; // mnOffset
  }

  /** Holds all cells of the same type/schema combo. */
  interface Table {
    dataType: SimDataType;
    schemaHash?: number; // iff dataType === Object
    name?: string; // iff it's a table for an instance
    rows: TableRow[];
  }

  /** A row in a Table that either contains a value or follows a schema. */
  interface TableRow {
    cell: cells.Cell;
    dataRef?: TableRowRef;
  }

  /** References a TableRow in a Table, specified by the type and schema. */
  interface TableRowRef {
    dataType: SimDataType;
    schemaHash?: number; // iff dataType === Object
    index: number; // index of cell to get
  }
  
  //#endregion Interfaces
  
  //#region Variables & Helpers

  function getPaddingForAlignment(index: number, alignmentMask: number): number {
    return -index & alignmentMask;
  }

  const nameHashes: { [key: string]: number } = {};
  function hashName({ name }: { name: string }): number {
    if (!(name in nameHashes)) nameHashes[name] = fnv32(name);
    return nameHashes[name];
  }

  const rawTables: { [key: number]: Table; } = {}; // key = data type
  const objectTables: { [key: number]: Table; } = {}; // key = schema hash
  function getTable(dataType: SimDataType, schemaHash?: number): Table {
    if (dataType === SimDataType.Object) {
      if (!objectTables[schemaHash]) objectTables[schemaHash] = {
        dataType,
        schemaHash, 
        rows: []
      };

      return objectTables[schemaHash];
    } else {
      if (!rawTables[dataType]) rawTables[dataType] = {
        dataType,
        rows: []
      };

      return rawTables[dataType];
    }
  }

  function getTableForCell(cell: cells.Cell): Table {
    return getTable(cell.dataType, (cell as cells.ObjectCell).schema?.hash);
  }

  function addToTable(cell: cells.Cell): TableRowRef {
    const table = getTableForCell(cell);
    if (cell.dataType === SimDataType.Object) {
      // TODO:
    }
  }

  //#endregion Variables & Helpers

  //#region Prepare Schemas

  let schemaSectionSize = 0;
  const serialSchemaMap: { [key: number]: SerialSchema } = {};
  const serialSchemas: SerialSchema[] = model.schemas.map(schema => {
    schemaSectionSize += 24; // size of schema header
    hashName(schema);

    const columns: SerialColumn[] = schema.columns.map(column => ({
      name: column.name,
      dataType: column.type,
      offset: 0  // to be set when column size is calculated
    }));

    columns.sort((a, b) => hashName(a) - hashName(b));

    let size = 0;
    columns.forEach(column => {
      schemaSectionSize += 20; // size of column header
      column.offset = size;
      size += SimDataTypeUtils.getBytes(column.dataType);
      size += getPaddingForAlignment(size, SimDataTypeUtils.getAlignment(column.dataType) - 1);
    });

    const serialSchema = {
      name: schema.name,
      hash: schema.hash,
      size,
      columns
    };

    serialSchemaMap[serialSchema.hash] = serialSchema;

    return serialSchema;
  });

  //#endregion Prepare Schemas

  //#region Prepare Tables

  // TODO:

  //#endregion Prepare Tables

  //#region Writing Buffers

  // use string itself (not encoded)
  const stringTableOffsets: { [key: string]: number } = {};
  const stringTableBuffer: Buffer = ((): Buffer => {
    // TODO:
  })();

  // use schema hash
  const schemaOffsets: { [key: number]: number } = {};
  const schemaBuffer: Buffer = ((): Buffer => {
    // TODO:
  })();

  // 3 sections combined to make alignment easier
  const headerAndTablesBuffer: Buffer = ((): Buffer => {
    let totalSize = HEADER_SIZE;
    const hasCharTable = charTableEntries.length > 0;
    const numTables = objectTables.length + valueTables.length + (hasCharTable ? 1 : 0);
    totalSize += numTables * 28;

    const objectTablePositions: { [key: number]: number; } = {}; // use schema hash
    objectTables.forEach(table => {
      totalSize += getPaddingForAlignment(totalSize, 15);
      totalSize += getPaddingForAlignment(totalSize, table.schema.size - 1);
      objectTablePositions[table.schema.hash] = totalSize;
      totalSize += table.schema.size * table.objects.length;
    });

    const valueTablePositions: { [key: number]: number; } = {}; // use data type
    valueTables.forEach(table => {
      totalSize += getPaddingForAlignment(totalSize, 15);
      totalSize += getPaddingForAlignment(totalSize, getAlignmentForType(table.dataType) - 1);
      valueTablePositions[table.dataType] = totalSize;
      totalSize += getBytesForType(table.dataType) * table.values.length;
    });

    const stringPositions: { [key: number]: number; } = {}; // use string index
    let charTableSize = 0;
    if (hasCharTable) {
      totalSize += getPaddingForAlignment(totalSize, 15);
      valueTablePositions[SimDataType.Character] = totalSize;
      charTableEntries.forEach((string, i) => {
        stringPositions[i] = totalSize;
        const stringSize = Buffer.byteLength(string, 'utf-8') + 1;
        charTableSize += stringSize;
        totalSize += stringSize;
      });
    }

    totalSize += getPaddingForAlignment(totalSize, 15);
    const buffer = Buffer.alloc(totalSize);
    const encoder = new BinaryEncoder(buffer);

    // header
    encoder.charsUtf8('DATA');
    encoder.uint32(model.version);
    encoder.int32(TABLE_HEADER_OFFSET);
    encoder.int32(numTables);
    encoder.int32(totalSize - encoder.tell()); // schema offset
    encoder.int32(model.schemas.length);
    encoder.uint32(model.unused === undefined ? 0 : model.unused);
    encoder.skip(4); // consistent padding

    // table header and data
    const bytesLeft = () => totalSize - encoder.tell();

    function getRelativeStringOffset(stringIndex: number): number {
      return stringPositions[stringIndex] - encoder.tell();
    }

    function getRelativeObjectOffset(objectValue: { schemaHash?: number; index: number; }): number {
      const schema = schemaFromHash[objectValue.schemaHash];
      const tablePos = objectTablePositions[objectValue.schemaHash];
      return tablePos + (schema.size * objectValue.index) - encoder.tell();
    }

    function getRelativeDataRefOffset(ref: DataRef): number {
      if (ref.dataType === SimDataType.Object) {
        return getRelativeObjectOffset(ref);
      } else {
        const tablePos = valueTablePositions[ref.dataType];
        const offset = getBytesForType(ref.dataType) * ref.index;
        return tablePos + offset - encoder.tell();
      }
    }

    function writeValue(dataType: SimDataType, value: any) {
      switch (dataType) {
        case SimDataType.Boolean:
          encoder.boolean(value);
          return;
        case SimDataType.Character:
          encoder.uint8(value); // intentionally uint8 since char is a byte
          return;
        case SimDataType.Int8:
          encoder.int8(value);
          return;
        case SimDataType.UInt8:
          encoder.uint8(value);
          return;
        case SimDataType.Int16:
          encoder.int16(value);
          return;
        case SimDataType.UInt16:
          encoder.uint16(value);
          return;
        case SimDataType.Int32:
          encoder.int32(value);
          return;
        case SimDataType.UInt32:
          encoder.uint32(value);
          return;
        case SimDataType.Int64:
          encoder.int64(value);
          return;
        case SimDataType.UInt64:
          encoder.uint64(value);
          return;
        case SimDataType.Float:
          encoder.float(value);
          return;
        case SimDataType.String:
          encoder.uint32(getRelativeStringOffset(value.stringIndex));
          return;
        case SimDataType.HashedString:
          encoder.uint32(getRelativeStringOffset(value.stringIndex));
          encoder.uint32(value.stringHash);
          return;
        case SimDataType.Object:
          encoder.uint32(getRelativeObjectOffset(value));
          return;
        case SimDataType.Vector:
          if (value.count === 0) {
            encoder.int32(RELOFFSET_NULL); // intentionally signed
          } else {
            encoder.uint32(getRelativeDataRefOffset(value.ref));
          }
          encoder.uint32(value.count);
          return;
        case SimDataType.Float2:
          encoder.float(value[0]);
          encoder.float(value[1]);
          return;
        case SimDataType.Float3:
          encoder.float(value[0]);
          encoder.float(value[1]);
          encoder.float(value[2]);
          return;
        case SimDataType.Float4:
          encoder.float(value[0]);
          encoder.float(value[1]);
          encoder.float(value[2]);
          encoder.float(value[3]);
          return;
        case SimDataType.TableSetReference:
          encoder.uint64(value);
          return;
        case SimDataType.ResourceKey:
          encoder.uint64(value.instance);
          encoder.uint32(value.type);
          encoder.uint32(value.group);
          return;
        case SimDataType.LocalizationKey:
          encoder.uint32(value);
          return;
        case SimDataType.Variant:
          if (value.ref === undefined) {
            encoder.int32(RELOFFSET_NULL);
          } else {
            encoder.int32(getRelativeDataRefOffset(value.ref)); // intentionally signed
          }
          encoder.uint32(value.typeHash);
          return;
        default:
          throw new Error(`Data type ${dataType} is not recognized (value = ${value}).`);
      }
    }

    objectTables.forEach(table => {
      // header
      if (table.name === undefined) {
        encoder.int32(RELOFFSET_NULL);
        encoder.uint32(NO_NAME_HASH);
      } else {
        encoder.int32(bytesLeft() + schemaBuffer.length + stringTableOffsets[table.name]);
        encoder.uint32(nameHashes[table.name]);
      }
      encoder.int32(bytesLeft() + schemaOffsets[table.schema.hash]);
      encoder.uint32(SimDataType.Object);
      encoder.uint32(table.schema.size);
      const tablePos = objectTablePositions[table.schema.hash];
      encoder.int32(tablePos - encoder.tell());
      encoder.uint32(table.objects.length);

      // data
      encoder.savePos(() => {
        encoder.seek(tablePos);
        table.objects.forEach(obj => {
          table.schema.columns.forEach(column => {
            encoder.savePos(() => {
              encoder.skip(column.offset);
              writeValue(column.dataType, obj[column.name]);
            });
          });
        });
      });
    });

    valueTables.forEach(table => {
      // header
      encoder.int32(RELOFFSET_NULL);
      encoder.uint32(NO_NAME_HASH);
      encoder.int32(RELOFFSET_NULL);
      encoder.uint32(table.dataType);
      encoder.uint32(getBytesForType(table.dataType));
      const tableOffset = valueTablePositions[table.dataType];
      encoder.int32(tableOffset - encoder.tell());
      encoder.uint32(table.values.length);

      // data
      encoder.savePos(() => {
        encoder.seek(tableOffset);
        table.values.forEach(value => {
          writeValue(table.dataType, value);
        });
      });
    });

    if (hasCharTable) {
      // header
      encoder.int32(RELOFFSET_NULL);
      encoder.uint32(NO_NAME_HASH);
      encoder.int32(RELOFFSET_NULL);
      encoder.uint32(SimDataType.Character);
      encoder.uint32(1); // bytes for a char
      const tableOffset = valueTablePositions[SimDataType.Character];
      encoder.int32(tableOffset - encoder.tell());
      encoder.uint32(charTableSize);

      // data
      encoder.savePos(() => {
        encoder.seek(tableOffset);
        charTableEntries.forEach(string => {
          encoder.charsUtf8(string);
          encoder.skip(1);
        });
      });
    }

    return buffer;
  })();

  //#endregion Writing Buffers

  return Buffer.concat([
    headerAndTablesBuffer,
    schemaBuffer,
    stringTableBuffer
  ]);
}
