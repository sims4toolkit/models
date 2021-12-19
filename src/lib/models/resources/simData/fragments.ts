import type SimDataResource from "./simDataResource";
import type { Cell, ObjectCell } from "./cells";
import CacheableModel from "../../abstract/cacheableModel";
import { SimDataType } from "./simDataTypes";
import { removeFromArray } from "../../../utils/helpers";


/**
 * A base for all sub-models that appear in a SimData.
 */
abstract class SimDataFragment extends CacheableModel {
  /** Removes this object from its owner. */
  abstract delete(): void;
}

/**
 * A schema in a SimData.
 */
export class SimDataSchema extends SimDataFragment {
  owner?: SimDataResource;

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
  set columns(columns) {
    columns.forEach(column => column.owner = this);
    this._columns = columns;
    this.uncache();
  }

  constructor({ name, hash, columns = [], owner }: {
    name: string;
    hash: number;
    columns?: SimDataSchemaColumn[];
    owner?: SimDataResource;
  }) {
    super(owner);
    this._name = name;
    this._hash = hash;
    columns.forEach(column => column.owner = this);
    this._columns = columns;
  }

  /**
   * Adds columns to this schema and then uncaches it.
   * 
   * @param columns Columns to add to this schema
   */
  addColumns(...columns: SimDataSchemaColumn[]) {
    columns.forEach(column => column.owner = this);
    this.columns.push(...columns);
    this.uncache();
  }

  /**
   * Removes columns from this schema and then uncaches it.
   * 
   * @param columns Columns to remove to this schema
   */
  removeColumns(...columns: SimDataSchemaColumn[]) {
    if(removeFromArray(columns, this.columns)) this.uncache();
  }

  delete() {
    this.owner?.removeSchemas(this); // removeSchemas() uncaches
  }
}

/**
 * A column in a SimData's schema.
 */
class SimDataSchemaColumn extends SimDataFragment {
  owner?: SimDataSchema;

  private _name: string;
  /** The name of this column. */
  get name() { return this._name; }
  set name(name) { this._name = name; this.uncache(); }

  private _type: SimDataType;
  /** The data type of this column. */
  get type() { return this._type; }
  set type(type) { this._type = type; this.uncache(); }

  private _flags: number;
  /** The flags for this column. Must be uint32. */
  get flags() { return this._flags; }
  set flags(flags) { this._flags = flags; this.uncache(); }

  constructor({ name, type, flags = 0, owner }: {
    name: string;
    type: SimDataType;
    flags?: number;
    owner?: SimDataSchema;
  }) {
    super(owner);
    this._name = name;
    this._type = type;
    this._flags = flags;
  }

  delete(): void {
    this.owner?.removeColumns(this); // removeColumns() uncaches
  }
}

/**
 * TODO:
 */
export class SimDataInstance extends SimDataFragment implements ObjectCell {
  readonly dataType: SimDataType.Object;

  private _name: string;
  /** TODO: */
  public get name(): string { return this._name; }
  public set name(value: string) { this._name = value; this.uncache(); }

  private _schemaHash: number;
  /** TODO: */
  public get schemaHash(): number { return this._schemaHash; }
  public set schemaHash(value: number) { this._schemaHash = value; this.uncache(); }
  
  private _rows: Cell[] = [];
  /** TODO: */
  public get rows(): Cell[] { return this._rows; }
  public set rows(value: Cell[]) { this._rows = value; this.uncache(); }

  constructor({ name, schema, rows = [], owner }: {
    name: string;
    schema: SimDataSchema;
    rows?: Cell[];
    owner?: SimDataResource;
  }) {
    super(owner);
    this._name = name;
    this._schemaHash = schema.hash; // FIXME: should just use entire schema?
    this._rows = rows; // FIXME: set owner?
  }

  delete(): void {
    //TODO:
  }
}
