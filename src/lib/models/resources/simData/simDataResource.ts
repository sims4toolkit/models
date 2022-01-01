import Resource from "../resource";
import { BinaryEncoder, BinaryDecoder } from "../../../utils/encoding";
import { fnv32 } from "../../../utils/hashing";
import { makeList, removeFromArray } from "../../../utils/helpers";
import { SimDataInstance, SimDataSchema, SimDataSchemaColumn } from "./fragments";
import type { SimDataRecursiveType } from "./simDataTypes";
import { SimDataType, SimDataTypeUtils } from "./simDataTypes";
import * as cells from "./cells";
import { XmlDocumentNode, XmlElementNode } from "../../xml/dom";
import { formatAsHexString } from "../../../utils/formatting";

interface SimDataResourceDto {
  version: number;
  unused: number;
  schemas: SimDataSchema[];
  instances: SimDataInstance[];
}

/**
 * A resource for SimData (binary tuning). SimDatas are essentially mini
 * relational databases, but to simplify working with them (and for consistency
 * with Sims 4 Studio), this model uses the concept of "instances". An
 * "instance" is an object cell that has a name.
 */
export default class SimDataResource extends Resource implements SimDataResourceDto {
  static SUPPORTED_VERSION = 0x101;

  readonly variant = 'DATA';
  private _schemas: SimDataSchema[];
  private _instances: SimDataInstance[];

  /**
   * The schemas in this SimData. Individual schemas can be mutated and cacheing
   * will be handled (e.g. `schemas[0].name = "Schema"` is perfectly safe),
   * however, mutating the array itself by adding or removing schemas should be
   * avoided whenever possible, because doing so is a surefire way to mess up
   * the cache. 
   * 
   * To add schemas, use the `addSchemas()` or `addSchemaClones()` methods. To
   * remove schemas, use the `removeSchemas()` method or call `delete()` on
   * individual schemas.
   * 
   * If you insist on removing from or editing the array manually, you can, as
   * long as you remember to call `uncache()` when you are done. If you insist
   * on adding schemas manually, it's your funeral.
   */
  get schemas() { return this._schemas; }
  
  /**
   * The instances in this SimData. Instances are not "real" parts of a SimData,
   * but this model uses them as a convenient way to avoid working with data
   * tables directly.
   * 
   * Individual instances can be mutated and cacheing will be handled (e.g. 
   * `instances[0].name = "Instance"` is perfectly safe), however, mutating the
   * array itself by adding or removing instances should be avoided whenever
   * possible, because doing so is a surefire way to mess up the cache. 
   * 
   * To add instances, use the `addInstances()` or `addInstanceClones()`
   * methods. To remove instances, use the `removeInstances()` method or call
   * `delete()` on individual instances.
   * 
   * If you insist on removing from or editing the array manually, you can, as
   * long as you remember to call `uncache()` when you are done. If you insist
   * on adding instances manually, it's your funeral.
   */
  get instances() { return this._instances; }

  /** Shorthand for `instances[0]` */
  get instance() { return this.instances[0]; }

  /** Shorthand for `instances[0].row` */
  get props() { return this.instance.row; }

  /** Shorthand for `schemas[0]` */
  get schema() { return this.schemas[0]; }

  protected constructor(
    public version: number,
    public unused: number,
    schemas: SimDataSchema[],
    instances: SimDataInstance[],
    buffer?: Buffer
  ) {
    super({ buffer });
    this._schemas = schemas;
    schemas.forEach(schema => schema.owner = this);
    this._instances = instances; 
    instances.forEach(instance => instance.owner = this);
    this._watchProps('version', 'unused');
  }

  clone(): SimDataResource {
    const newSchemas = this.schemas.map(s => s.clone());
    const instances = this.instances.map(i => i.clone({ newSchemas }));
    return new SimDataResource(this.version, this.unused, newSchemas, instances);
  }

  /**
   * Creates a new SimDataResource with the given optional parameters.
   * 
   * Arguments
   * - `version`: The version of the SimData. This should be 0x101; it can be
   * left out and it will be 0x101 by default.
   * - `unused`: The "unused" UInt32 in the SimData header. This number should
   * correspond to the group number of the pack associated with this SimData,
   * or be 0 if it does not require a pack. Default is 0.
   * - `schemas`: A list of the schemas in this SimData. Default is empty.
   * - `instances`: A list of the instances in this SimData. Default is empty.
   * 
   * @param arguments Arguments for creating this SimData
   */
  static create({
    version = SimDataResource.SUPPORTED_VERSION,
    unused = 0,
    schemas = [],
    instances = []
  }: SimDataResourceDto): SimDataResource {
    return new SimDataResource(version, unused, schemas, instances);
  }

  /**
   * Creats a new SimDataResource from a buffer containing a binary DATA file.
   * 
   * @param buffer Buffer to read
   */
  static from(buffer: Buffer): SimDataResource {
    const { version, unused, schemas, instances } = readData(buffer);
    return new SimDataResource(version, unused, schemas, instances, buffer);
  }

  /**
   * Creats a SimDataResource from S4S-style XML.
   * 
   * @param xml XML string or buffer to parse as a SimData
   * @throws If the given XML could not be parsed as a SimData
   */
  static fromXml(xml: string | Buffer): SimDataResource {
    const dom = XmlDocumentNode.from(xml).child;
    const schemasNode = dom.children.find(node => node.tag === "Schemas");
    schemasNode.children.map(schemaNode => {
      //
    });
    const instancesNode = dom.children.find(node => node.tag === "Instances");
  }

  /**
   * Adds schemas to this SimData and uncaches the buffer.
   * 
   * @param schemas Schemas to add
   */
  addSchemas(...schemas: SimDataSchema[]) {
    this.schemas.push(...schemas);
    schemas.forEach(schema => schema.owner = this);
    this.uncache();
  }

  /**
   * Removes schemas from this SimData and uncaches the buffer. Note that
   * schemas are removed by reference equality, so the passed in schemas must be
   * the exact objects you want to remove. Alternatively, you can call
   * `delete()` on the schemas themselves to remove them one by one.
   * 
   * @param schemas Schemas to remove
   */
  removeSchemas(...schemas: SimDataSchema[]) {
    if (removeFromArray(schemas, this.schemas)) this.uncache();
  }

  /**
   * Adds instances to this SimData and uncaches the buffer.
   * 
   * @param instances Instances to add
   */
  addInstances(...instances: SimDataInstance[]) {
    this.instances.push(...instances);
    instances.forEach(instance => instance.owner = this);
    this.uncache();
  }

  /**
   * Removes instances from this SimData and uncaches the buffer. Note that
   * instances are removed by reference equality, so the passed in instances
   * must be the exact objects you want to remove. Alternatively, you can call
   * `delete()` on the instances themselves to remove them one by one.
   * 
   * @param instances Instances to remove
   */
  removeInstances(...instances: SimDataInstance[]) {
    if (removeFromArray(instances, this.instances)) this.uncache();
  }

  /**
   * Creates an XmlDocumentNode object that represents this SimData exactly as
   * it would appear in Sims 4 Studio.
   */
  toXmlDocument(): XmlDocumentNode {
    return new XmlDocumentNode(new XmlElementNode({
      tag: 'SimData',
      attributes: {
        version: formatAsHexString(this.version, 8, true),
        u: formatAsHexString(this.unused, 8, true)
      },
      children: [
        new XmlElementNode({
          tag: 'Instances',
          children: this.instances.map(i => i.toXmlNode())
        }),
        new XmlElementNode({
          tag: 'Schemas',
          children: this.schemas.map(s => s.toXmlNode())
        })
      ]
    }));
  }

  protected _serialize(): Buffer {
    return writeData(this);
  }
}

//#region Serialization

// FIXME: there could potentially be an issue with padding when writing booleans,
// for an example use the scenario role that chip sent

const RELOFFSET_NULL = -0x80000000;
const NO_NAME_HASH = 0x811C9DC5; // equal to fnv32('')
const HEADER_SIZE = 32; // includes 4 bytes of padding

/**
 * Reads a binary DATA file in a buffer as a SimData.
 * 
 * @param buffer Buffer to read
 */
function readData(buffer: Buffer): SimDataResourceDto {
  const decoder = new BinaryDecoder(buffer);

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

  //#region Helpers

  function getBinarySchema(offset: number): BinarySchema { // BT has int64 here
    const index = mSchema.findIndex(schema => offset === schema.startof_mnNameOffset);
    if (index >= 0) return mSchema[index];
    console.warn(`Unknown schema offset ${offset}`);
    return undefined;
  }

  function getTableInfo(position: number): BinaryTableInfo {
    const tableInfo = mTable.find(tableInfo => {
      const start = tableInfo.startof_mnRowOffset + tableInfo.mnRowOffset;
      const end = start + (tableInfo.mnRowSize * tableInfo.mnRowCount) - 1;
      return position >= start && position <= end;
    });

    if (tableInfo === undefined) console.warn(`Position ${position} is not located in a TableData.`);
    return tableInfo;
  }

  function getName(named: HasNameOffset): string {
    if (named.mnNameOffset === RELOFFSET_NULL) return undefined;
    decoder.seek(named.startof_mnNameOffset + named.mnNameOffset);
    return decoder.string();
  }

  //#endregion Helpers

  //#region Structs

  function structTableInfo(): BinaryTableInfo {
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

    ti.name = decoder.savePos<string>(() => getName(ti));
    return ti;
  }

  function structSchemaColumn(): BinarySchemaColumn {
    const sc: BinarySchemaColumn = {
      startof_mnNameOffset: decoder.tell(),
      mnNameOffset: decoder.int32(),
      mnNameHash: decoder.uint32(),
      mnDataType: decoder.uint16(),
      mnFlags: decoder.uint16(),
      mnOffset: decoder.uint32(),
      mnSchemaOffset: decoder.int32()
    };

    sc.name = decoder.savePos<string>(() => getName(sc));
    return sc;
  }

  function structSchema(): BinarySchema {
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
      const mColumn = makeList<BinarySchemaColumn>(mnNumColumns, structSchemaColumn);
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
  
      schema.name = getName(schema);
    });

    return schema;
  }

  //#endregion Structs

  //#region Cells

  function readVariantCell(typeHash: number, tableInfo: BinaryTableInfo): cells.VariantCell {
    const dataType = tableInfo.mnDataType;

    // objs are different, because variants point directly to their data
    const childCell: cells.Cell = (dataType === SimDataType.Object) ?
      readObjectCell(getTableInfo(decoder.tell())) :
      readCell(dataType);
    
    return new cells.VariantCell(typeHash, childCell);
  }

  function readVectorCell(count: number, tableInfo: BinaryTableInfo): cells.VectorCell {
    const childType = tableInfo.mnDataType;

    // objs are different, because vectors point directly to their data
    const childGenFn: () => cells.Cell = childType === SimDataType.Object ?
      (() => {
        const childTableInfo = getTableInfo(decoder.tell());
        return () => readObjectCell(childTableInfo);
      })() :
      () => readCell(childType);

    return new cells.VectorCell(makeList(count, childGenFn));
  }

  function readObjectCell(tableInfo: BinaryTableInfo): cells.ObjectCell {
    const binarySchema = getBinarySchema(tableInfo.startof_mnSchemaOffset + tableInfo.mnSchemaOffset);
    const schema = schemas.find(schema => schema.hash === binarySchema.mnSchemaHash);

    const row: cells.ObjectCellRow = {};
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
    const dataPos = startPos + dataOffset;
    const tableInfo = getTableInfo(dataPos);

    switch (dataType) {
      case SimDataType.Object:
        if (dataOffset === RELOFFSET_NULL)
          throw new Error("Object cell does not have any data defined.");
        return decoder.savePos<cells.ObjectCell>(() => {
          decoder.seek(dataPos);
          return readObjectCell(tableInfo);
        });
      case SimDataType.Vector:
        const count = decoder.uint32();
        if (dataOffset === RELOFFSET_NULL || count === 0)
          return new cells.VectorCell<cells.Cell>([]);
        return decoder.savePos<cells.VectorCell<cells.Cell>>(() => {
          decoder.seek(dataPos);
          return readVectorCell(count, tableInfo);
        });
      case SimDataType.Variant:
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

  function readCell(dataType: SimDataType): cells.Cell {
    switch (dataType) {
      case SimDataType.Boolean:
        return cells.BooleanCell.decode(decoder);
      case SimDataType.Character:
      case SimDataType.String:
      case SimDataType.HashedString:
        return cells.TextCell.decode(dataType, decoder);
      case SimDataType.Int8:
      case SimDataType.UInt8:
      case SimDataType.Int16:
      case SimDataType.UInt16:
      case SimDataType.Int32:
      case SimDataType.UInt32:
      case SimDataType.Float:
      case SimDataType.LocalizationKey:
        return cells.NumberCell.decode(dataType, decoder);
      case SimDataType.Int64:
      case SimDataType.UInt64:
      case SimDataType.TableSetReference:
        return cells.BigIntCell.decode(dataType, decoder);
      case SimDataType.Float2:
        return cells.Float2Cell.decode(decoder);
      case SimDataType.Float3:
        return cells.Float3Cell.decode(decoder);
      case SimDataType.Float4:
        return cells.Float4Cell.decode(decoder);
      case SimDataType.ResourceKey:
        return cells.ResourceKeyCell.decode(decoder);
      case SimDataType.Undefined:
        throw new Error(`Cannot get value for data type ${dataType}`);
      default: 
        return readCellFromPointer(dataType);
    }
  }

  //#endregion Cells

  //#region Content

  // Header and binary info
  const mnFileIdentifier = decoder.charsUtf8(4);
  if (mnFileIdentifier !== "DATA")
    throw new Error("Not a SimData file (must begin with \"DATA\").");
  const mnVersion = decoder.uint32();
  if (mnVersion < 0x100 || mnVersion > 0x101)
    throw new Error("Unknown version (must be 0x100 or 0x101).");
  const nTableHeaderPos = decoder.tell();
  const mnTableHeaderOffset = decoder.int32();
  const mnNumTables = decoder.int32();
  const nSchemaPos = decoder.tell(); // BT has int64 here
  const mnSchemaOffset = decoder.int32();
  const mnNumSchemas = decoder.int32();
  const mUnused = mnVersion >= 0x101 ? decoder.uint32() : undefined;
  decoder.seek(nTableHeaderPos + mnTableHeaderOffset);
  const mTable = makeList<BinaryTableInfo>(mnNumTables, structTableInfo);
  decoder.seek(nSchemaPos + mnSchemaOffset);
  const mSchema = makeList<BinarySchema>(mnNumSchemas, structSchema);

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

  //#endregion Content

  return {
    version: mnVersion,
    unused: mUnused,
    schemas,
    instances
  };
}

/**
 * Writes a SimData model as a binary DATA file.
 * 
 * @param model SimData model to write
 */
function writeData(model: SimDataResourceDto): Buffer {
  // TODO:
  return undefined;
}

//#endregion Serialization
