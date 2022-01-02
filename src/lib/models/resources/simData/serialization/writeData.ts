import { BinaryEncoder } from "../../../../utils/encoding";
import { formatAsHexString } from "../../../../utils/formatting";
import { fnv32 } from "../../../../utils/hashing";
import { SimDataDto, HEADER_SIZE, TABLE_HEADER_OFFSET, RELOFFSET_NULL, NO_NAME_HASH, SUPPORTED_VERSION } from "../shared";
import { SimDataType, SimDataTypeUtils } from "../simDataTypes";
import * as cells from "../simDataCells";

// FIXME: there could potentially be an issue with padding when writing booleans,
// for an example use the scenario role that chip sent

//#region Interfaces

/** A DTO for schemas when they're being serialized. */
interface SerialSchema {
  name: string; // what mnNameOffset points to
  hash: number; // mnSchemaHash
  size: number; // mnSchemaSize
  columns: SerialColumn[]; // mColumn
}

/** A DTO for schema columns when they're being serialized. */
interface SerialColumn {
  name: string; // what mnNameOffset points to
  dataType: SimDataType; // mnDataType
  offset: number; // mnOffset
}

/** A table in a DATA file that contains plain values or reference types. */
interface RawTable {
  dataType: SimDataType;
  row: TableRow;
}

/** A table in a DATA file that contains objects that follow a schema. */
interface ObjectTable {
  name?: string; // iff it's a table for an instance
  schemaHash: number;
  rows: TableRow[];
}

/** A row in a table. */
type TableRow = TableCell[];

/** A cell in a row. */
interface TableCell {
  cell: cells.Cell;
  ref?: TableRef;
}

/** References a cell in a Table, specified by the type and schema. */
interface TableRef {
  dataType?: SimDataType;
  schemaHash?: number; // iff dataType === Object
  index: number; // index of row to get
}

const TABLEREF_NULL: TableRef = { index: RELOFFSET_NULL };

//#endregion Interfaces

//#region Helpers

/**
 * Gets the padding to use at the given index for the given alignment.
 * 
 * @param index Byte index of encoder
 * @param alignmentMask Byte mask to use for alignment
 */
function getPaddingForAlignment(index: number, alignmentMask: number): number {
  return -index & alignmentMask;
}

//#endregion Helpers

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
  
  //#region Mappings & Getters

  /** Maps name strings to their 32-bit hashes. */
  const nameHashes: { [key: string]: number } = {};
  function hashName({ name }: { name: string }): number {
    if (!(name in nameHashes)) nameHashes[name] = fnv32(name);
    return nameHashes[name];
  }

  /** Maps SimDataTypes to their tables. */
  const rawTables: { [key: number]: RawTable; } = {};
  function getRawTable(dataType: SimDataType): RawTable {
    if (!(dataType in rawTables)) rawTables[dataType] = {
      dataType,
      row: []
    };

    return rawTables[dataType];
  }

  /** Maps schema hashes to their Objects' tables. */
  const objectTables: { [key: number]: ObjectTable; } = {};
  function getObjectTable(schemaHash: number): ObjectTable {
    if (!(schemaHash in objectTables)) objectTables[schemaHash] = {
      schemaHash,
      rows: []
    };

    return objectTables[schemaHash];
  }

  //#endregion  Mappings & Getters

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

  /**
   * The total length of the char table. This is stored in a variable for use
   * with table refs, since strings and hashed strings are stored in the char
   * table but will not actually be added until later.
   */
  let charTableLength: number = 0;
  const stringsToAddToCharTable: string[] = [];

  function addCell(cell: cells.Cell): TableRef {
    switch (cell.dataType) {
      case SimDataType.Object:
        return addObjectCell(cell as cells.ObjectCell);
      case SimDataType.Vector:
        return addVectorCell(cell as cells.VectorCell);
      case SimDataType.Variant:
        return addVariantCell(cell as cells.VariantCell);
      case SimDataType.Character:
      case SimDataType.String:
      case SimDataType.HashedString:
        return addTextCell(cell as cells.TextCell);
      default:
        return addPrimitiveCell(cell);
    }
  }

  function addPrimitiveCell(cell: cells.Cell): TableRef {
    const table = getRawTable(cell.dataType);
        
    const ref: TableRef = {
      dataType: cell.dataType,
      index: table.row.length
    };

    table.row.push({ cell });

    return ref;
  }

  function addTextCell(cell: cells.TextCell): TableRef {
    const ref: TableRef = {
      dataType: SimDataType.Character,
      index: charTableLength
    };

    charTableLength += Buffer.byteLength(cell.value) + 1; // +1 for null
    stringsToAddToCharTable.push(cell.value);

    return ref;
  }

  function addVectorCell(cell: cells.VectorCell): TableRef {
    if (cell.childType === undefined) return TABLEREF_NULL;

    let firstChildRef: TableRef;
    cell.children.forEach(child => {
      const ref = addCell(child);
      if (!firstChildRef) firstChildRef = ref;
    });

    return firstChildRef;
  }

  function addVariantCell(cell: cells.VariantCell): TableRef {
    return cell.child ? addCell(cell.child) : TABLEREF_NULL;
  }

  function addObjectCell(obj: cells.ObjectCell, table?: ObjectTable): TableRef {
    table = table ?? getObjectTable(obj.schema.hash);

    const ref: TableRef = {
      dataType: obj.dataType,
      schemaHash: obj.schema.hash,
      index: table.rows.length,
    };

    table.rows.push(obj.schema.columns.map(column => {
      const cell = obj.row[column.name];
      return { cell, ref: addCell(cell) }
    }));

    return ref;
  }

  model.instances.forEach(instance => {
    hashName(instance);
    const table = getObjectTable(instance.schema.hash);
    if (!table.name && instance.name) table.name = instance.name;
    addObjectCell(instance, table);
  });

  //#endregion Prepare Tables

  //#region Writing Buffers

  // use string itself (not encoded)
  const stringTableOffsets: { [key: string]: number } = {};
  const stringTableBuffer: Buffer = ((): Buffer => {
    const strings = Object.keys(nameHashes);

    const buffer = Buffer.alloc(strings.reduce((prev, string) => {
      return prev + Buffer.byteLength(string) + 1;
    }, 0));
  
    let offset = 0;
    strings.forEach(string => {
      buffer.write(string, offset, 'utf-8');
      stringTableOffsets[string] = offset;
      offset += Buffer.byteLength(string) + 1;
    });
  
    return buffer;
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
