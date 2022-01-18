import { BinaryEncoder } from "@s4tk/encoding";
import { formatAsHexString } from "@s4tk/utils/formatting";
import { fnv32 } from "@s4tk/utils/hashing";
import { SimDataDto, HEADER_SIZE, TABLE_HEADER_OFFSET, RELOFFSET_NULL, NO_NAME_HASH, SUPPORTED_VERSION, CellEncodingOptions } from "../shared";
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
  flags: number;
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
  schema: SerialSchema;
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

/**
 * Returns whether or not the given cell is a reference type. That is, whether
 * its value is stored in an object directly or needs to be stored in another
 * table and be referenced.
 * 
 * @param cell Cell to check
 */
function isReferenceType(cell: cells.Cell): boolean {
  switch (cell.dataType) {
    case SimDataType.Object:
    case SimDataType.Vector:
    case SimDataType.Variant:
      return true;
    default:
      return false;
  }
}

/**
 * Returns whether or not the given cell is a string type. That is, whether
 * it needs to point to a string table or not.
 * 
 * @param cell Cell to check
 */
function isStringType(cell: cells.Cell): boolean {
  switch (cell.dataType) {
    // FIXME: is character a string type?
    case SimDataType.String:
    case SimDataType.HashedString:
      return true;
    default:
      return false;
  }
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

  const rawTables: RawTable[] = [];
  function getRawTable(dataType: SimDataType): RawTable {
    let table = rawTables.find(table => table.dataType === dataType);

    if (!table) {
      table = { dataType, row: [] };
      rawTables.push(table);
    }

    return table;
  }

  const objectTables: ObjectTable[] = [];
  function getObjectTable(schemaHash: number): ObjectTable {
    let table = objectTables.find(table => table.schema.hash === schemaHash);

    if (!table) {
      table = { schema: serialSchemaMap[schemaHash], rows: [] };
      objectTables.push(table);
    }

    return table;
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
      flags: column.flags,
      offset: 0  // to be set when column size is calculated
    }));

    columns.forEach(column => hashName(column)); // needed for when there is 1
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

  function addTextCell(cell: cells.TextCell, getCharRef = false): TableRef {
    const charRef: TableRef = {
      dataType: SimDataType.Character,
      index: charTableLength
    };

    charTableLength += Buffer.byteLength(cell.value, 'utf-8') + 1; // +1 for null
    stringsToAddToCharTable.push(cell.value);

    if ((cell.dataType === SimDataType.Character) || getCharRef) {
      return charRef;
    } else {
      const table = getRawTable(cell.dataType);
      table.row.push({ cell, ref: charRef });

      return {
        dataType: cell.dataType,
        index: table.row.length - 1
      };
    }
  }

  function addVectorCell(cell: cells.VectorCell): TableRef {
    if (cell.childType === SimDataType.Vector || cell.childType === SimDataType.Variant) {
      let firstChildRef: TableRef;
      cell.children.forEach(child => {
        const table = getRawTable(child.dataType);
        
        const ref: TableRef = {
          dataType: child.dataType,
          index: table.row.length
        };
  
        table.row.push({ cell: child, ref: addCell(child) });
  
        if (!firstChildRef) firstChildRef = ref;
      });
      return firstChildRef;
    } else {
      return addVectorChildren(cell);
    }
  }

  function addVectorChildren(cell: cells.VectorCell): TableRef {
    if (cell.childType === undefined) return TABLEREF_NULL;

    let firstChildRef: TableRef;
    cell.children.forEach(child => {
      const ref = addCell(child);
      if (!firstChildRef) firstChildRef = ref;
    });

    return firstChildRef;
  }

  function addVariantCell(cell: cells.VariantCell): TableRef {
    if (cell.childType === SimDataType.Vector || cell.childType === SimDataType.Variant) {
      const { child } = cell;
      const table = getRawTable(child.dataType);
      
      const ref: TableRef = {
        dataType: child.dataType,
        index: table.row.length
      };

      table.row.push({ cell: child, ref: addCell(child) });

      return ref;
    } else {
      return addVariantChild(cell);
    }
  }

  function addVariantChild(cell: cells.VariantCell): TableRef {
    return cell.child ? addCell(cell.child) : TABLEREF_NULL;
  }

  function addObjectCell(obj: cells.ObjectCell, table?: ObjectTable): TableRef {
    table = table ?? getObjectTable(obj.schema.hash);

    const ref: TableRef = {
      dataType: obj.dataType,
      schemaHash: obj.schema.hash,
      index: table.rows.length,
    };

    table.rows.push(table.schema.columns.map(column => {
      const cell = obj.row[column.name];
      if (isReferenceType(cell)) {
        return { cell, ref: addCell(cell) };
      } else if (isStringType(cell)) {
        return { cell, ref: addTextCell(cell as cells.TextCell, true) };
      } else {
        return { cell };
      }
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

  /** Maps unencoded strings in the string table to their offsets. */
  const stringTableOffsets: { [key: string]: number } = {};
  const stringTableBuffer: Buffer = ((): Buffer => {
    const strings = Object.keys(nameHashes);

    const buffer = Buffer.alloc(strings.reduce((prev, string) => {
      return prev + Buffer.byteLength(string, 'utf-8') + 1;
    }, 0));
  
    let offset = 0;
    strings.forEach(string => {
      buffer.write(string, offset, 'utf-8');
      stringTableOffsets[string] = offset;
      offset += Buffer.byteLength(string, 'utf-8') + 1;
    });
  
    return buffer;
  })();

  /** Maps schema hashes to their offsets. */
  const schemaOffsets: { [key: number]: number } = {};
  const schemaBuffer: Buffer = ((): Buffer => {
    let columnStart = 0;
    let totalSize = 0;
    serialSchemas.forEach((schema, i) => {
      columnStart += 24;
      totalSize += 24 + (20 * schema.columns.length);
      schemaOffsets[schema.hash] = 24 * i;
    });

    const buffer = Buffer.alloc(totalSize);
    const encoder = new BinaryEncoder(buffer);

    const nameOffset = (name: string) => {
      const value = totalSize - encoder.tell() + stringTableOffsets[name];
      if (Number.isNaN(value))
        throw new Error(`Name '${name}' never had its offset recorded.`);
      return value;
    }
    
    let filledColumns = 0;
    serialSchemas.forEach(schema => {
      encoder.int32(nameOffset(schema.name));
      encoder.uint32(nameHashes[schema.name]);
      encoder.uint32(schema.hash);
      encoder.uint32(schema.size);
      const columnOffsetPos = encoder.tell();
      let firstColumnPos: number;
      encoder.skip(4); // we'll come back to it
      encoder.uint32(schema.columns.length);
      encoder.savePos(() => {
        // write all columns
        encoder.seek(columnStart + filledColumns);
        schema.columns.forEach((column, i) => {
          if (i === 0) firstColumnPos = encoder.tell();
          encoder.int32(nameOffset(column.name));
          encoder.uint32(nameHashes[column.name]);
          encoder.uint16(column.dataType);
          encoder.uint16(column.flags); // flags
          encoder.uint32(column.offset);
          encoder.int32(RELOFFSET_NULL); // FIXME: is this actually used?
          filledColumns += 20;
        });

        // write column offset
        encoder.seek(columnOffsetPos);
        encoder.int32(firstColumnPos - encoder.tell());
      });
    });

    return buffer;
  })();

  // 3 sections combined to make alignment easier
  const headerAndTablesBuffer: Buffer = ((): Buffer => {
    let totalSize = HEADER_SIZE;
    const hasCharTable = stringsToAddToCharTable.length > 0;
    const numTables = Object.keys(rawTables).length + Object.keys(objectTables).length + (hasCharTable ? 1 : 0);
    totalSize += numTables * 28;

    /** Maps schema hash to position of object table. */
    const objectTablePositions: { [key: number]: number; } = {};
    objectTables.forEach(table => { 
      totalSize += getPaddingForAlignment(totalSize, 15);
      totalSize += getPaddingForAlignment(totalSize, table.schema.size - 1);
      objectTablePositions[table.schema.hash] = totalSize;
      totalSize += table.schema.size * table.rows.length;
    });

    /** Maps data type to position of raw table. */
    const rawTablePositions: { [key: number]: number; } = {};
    rawTables.forEach(table => {
      totalSize += getPaddingForAlignment(totalSize, 15);
      totalSize += getPaddingForAlignment(totalSize, SimDataTypeUtils.getAlignment(table.dataType) - 1);
      rawTablePositions[table.dataType] = totalSize;
      totalSize += SimDataTypeUtils.getBytes(table.dataType) * table.row.length;
    });

    if (hasCharTable) {
      totalSize += getPaddingForAlignment(totalSize, 15);
      rawTablePositions[SimDataType.Character] = totalSize;
      totalSize += charTableLength;
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

    function getOffsetForTableRef(ref: TableRef): number {
      if (ref.dataType === undefined) return RELOFFSET_NULL;

      let pos: number, offset: number;
      if (ref.dataType === SimDataType.Object) {
        pos = objectTablePositions[ref.schemaHash];
        offset = serialSchemaMap[ref.schemaHash].size * ref.index;
      } else {
        pos = rawTablePositions[ref.dataType];
        offset = SimDataTypeUtils.getBytes(ref.dataType) * ref.index;
      }

      return pos + offset - encoder.tell();
    }

    function writeCell(tableCell: TableCell) {
      const options: CellEncodingOptions = {};

      if (tableCell.ref) {
        options.offset = getOffsetForTableRef(tableCell.ref);
      }

      tableCell.cell.encode(encoder, options);
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
      encoder.uint32(table.rows.length);

      // data
      encoder.savePos(() => {
        encoder.seek(tablePos);
        table.rows.forEach((row, i) => {
          encoder.skip(table.schema.size * i);
          table.schema.columns.forEach((column, j) => {
            encoder.savePos(() => {
              encoder.skip(column.offset);
              writeCell(row[j]);
            });
          });
        });
      });
    });

    rawTables.forEach(table => {
      // header
      encoder.int32(RELOFFSET_NULL);
      encoder.uint32(NO_NAME_HASH);
      encoder.int32(RELOFFSET_NULL);
      encoder.uint32(table.dataType);
      encoder.uint32(SimDataTypeUtils.getBytes(table.dataType));
      const tableOffset = rawTablePositions[table.dataType];
      encoder.int32(tableOffset - encoder.tell());
      encoder.uint32(table.row.length);

      // data
      encoder.savePos(() => {
        encoder.seek(tableOffset);
        table.row.forEach(writeCell);
      });
    });

    if (hasCharTable) {
      // header
      encoder.int32(RELOFFSET_NULL);
      encoder.uint32(NO_NAME_HASH);
      encoder.int32(RELOFFSET_NULL);
      encoder.uint32(SimDataType.Character);
      encoder.uint32(1); // bytes for a char
      const tableOffset = rawTablePositions[SimDataType.Character];
      encoder.int32(tableOffset - encoder.tell());
      encoder.uint32(charTableLength);

      // data
      encoder.savePos(() => {
        encoder.seek(tableOffset);
        stringsToAddToCharTable.forEach(string => {
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
