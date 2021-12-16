import Resource from "./resource";
import { BinaryEncoder, BinaryDecoder } from "../../utils/encoding";
import { fnv32 } from "../../utils/hashing";
import { removeFromArray } from "../../utils/helpers";

/**
 * A resource for SimData (binary tuning). SimDatas are essentially mini
 * relational databases, but to simplify working with them as well as for
 * consistency with Sims 4 Studio, this model uses the concept of "instances".
 * An "instance" is simply an object table that has a name.
 */
export default class SimDataResource extends Resource {
  readonly variant = 'DATA';

  private _schemas: SimDataSchema[];
  /** The schemas in this SimData. */
  get schemas() { return this._schemas; }
  
  private _instances: SimDataInstance[];
  /** The instance in this SimData. */
  get instances() { return this._instances; }

  private constructor({ schemas = [], instances = [], buffer }: {
    schemas?: SimDataSchema[];
    instances?: SimDataInstance[];
    buffer?: Buffer;
  } = {}) {
    super({ buffer });
    this._schemas = schemas;
    this._instances = instances;
  }

  clone(): SimDataResource {
    return undefined;
  }

  /**
   * TODO:
   */
  static create(): SimDataResource {
    // TODO:
    return
  }

  /**
   * TODO:
   */
  static from(buffer: Buffer): SimDataResource {
    // TODO:
    return
  }

  /**
   * Adds schemas to this SimData and uncaches the buffer.
   * 
   * @param schemas Schemas to add
   */
  addSchemas(...schemas: SimDataSchema[]) {
    this.schemas.push(...schemas);
    this.uncache();
  }

  /**
   * Removes schemas from this SimData and uncaches the buffer.
   * 
   * @param schemas Schemas to remove
   */
  removeSchemas(...schemas: SimDataSchema[]) {
    if (removeFromArray<SimDataSchema>(schemas, this.schemas))
      this.uncache();
  }

  /**
   * Adds instances to this SimData and uncaches the buffer.
   * 
   * @param instances Instances to add
   */
  addInstances(...instances: SimDataInstance[]) {
    this.instances.push(...instances);
    this.uncache();
  }

  /**
   * Removes instances from this SimData and uncaches the buffer.
   * 
   * @param instances Instances to remove
   */
  removeInstances(...instances: SimDataInstance[]) {
    if (removeFromArray<SimDataInstance>(instances, this.instances))
      this.uncache();
  }

  protected _serialize(): Buffer {
    return undefined; // TODO: impl
  }
}

//#region Helper models

interface Uncacheable {
  /** The object that this one belongs to. */
  readonly owner?: Uncacheable;

  /** Notifies this object's owner to uncache. */
  uncache(): void;
}

abstract class SimDataFragment implements Uncacheable {
  constructor(public owner?: Uncacheable) {}
  
  uncache(): void { this.owner?.uncache(); }

  /** Removes this object from its owner. */
  abstract delete(): void;
}

class SimDataSchema extends SimDataFragment {
  readonly owner?: SimDataResource;

  private _name: string;
  /** The name of this schema. */
  get name() { return this._name; }
  set name(name) { this._name = name; this.uncache(); }

  private _hash: number;
  /** The hash of this schema. This is not necessarily the hash of the name. */
  get hash() { return this._hash; }
  set hash(hash) { this._hash = hash; this.uncache(); }

  private _columns: SimDataSchemaColumn[];
  /** The columns in this schema. Do not add or remove items from this array
   * manually - use the `addColumns()` and `removeColumns()` methods for that.
   * If you do mutate the array, be sure to call `uncache()` afterwards. */
  get columns() { return this._columns; }
  set columns(columns) { this._columns = columns; this.uncache(); }

  constructor({ name, hash, columns = [], owner }: {
    name: string;
    hash: number;
    columns?: SimDataSchemaColumn[];
    owner?: SimDataResource;
  }) {
    super(owner);
    this._name = name;
    this._hash = hash;
    this._columns = columns;
  }

  /**
   * Adds columns to this schema and then uncaches it.
   * 
   * @param columns Columns to add to this schema
   */
  addColumns(...columns: SimDataSchemaColumn[]) {
    this.columns.push(...columns);
    this.uncache();
  }

  /**
   * Removes columns from this schema and then uncaches it.
   * 
   * @param columns Columns to remove to this schema
   */
   removeColumns(...columns: SimDataSchemaColumn[]) {
    this.columns.push(...columns);
    this.uncache();
  }

  delete() {
    this.owner?.removeSchemas(this);
    // removeSchemas already uncaches
  }
}

class SimDataSchemaColumn {
  constructor(
    public name: string,
    public type: SimDataType,
    public flags: number,
    private _owner: SimDataSchema
  ) {}
}

abstract class SimDataValue {
  abstract readonly type: SimDataType;
}

class SimDataPrimitiveValue extends SimDataValue {
  readonly type: SimDataType;
  value: any;
}

class SimDataVectorValue extends SimDataValue {
  readonly type = SimDataType.Vector;
  childType: SimDataType;
  children: SimDataValue[];
}

class SimDataVariantValue extends SimDataValue {
  readonly type = SimDataType.Variant;
  variantHash: number;
  child?: SimDataValue;
}

class SimDataObjectValue extends SimDataValue {
  readonly type = SimDataType.Object;
  schema: SimDataSchema;
  rows: { name: string; value: SimDataValue; }[];
}

class SimDataInstance extends SimDataObjectValue {
  name: string;
}

//#endregion Helper models

//#region Data Types

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

/**
* Returns the alignment for the given SimDataType.
* 
* @param dataType The SimDataType to get the alignment for
*/
function getAlignmentForType(dataType: SimDataType): number {
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
function getBytesForType(dataType: SimDataType): number {
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

//#endregion Data Types
