import type SimDataResource from "./simDataResource";
import type { Cell, ObjectCell } from "./cells";
import CacheableModel from "../../abstract/cacheableModel";
import { SimDataType } from "./simDataTypes";
import { removeFromArray } from "../../../utils/helpers";

abstract class SimDataFragment extends CacheableModel {
  /** Removes this object from its owner. */
  abstract delete(): void;
}

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

export class SimDataSchemaColumn extends SimDataFragment {
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

export class SimDataInstance extends SimDataFragment implements ObjectCell {
  readonly dataType: SimDataType.Object;
  owner?: SimDataResource;

  private _name: string;
  /** The name of this instance. */
  public get name() { return this._name; }
  public set name(value) { this._name = value; this.uncache(); }

  private _schema: SimDataSchema;
  /** The schema that this instance follows. */
  public get schema() { return this._schema; }
  public set schema(value) { this._schema = value; this.uncache(); }
  
  private _values: Cell[] = [];
  /** The values for this instance's columns. */
  public get values() { return this._values; }
  public set values(value) { this._values = value; this.uncache(); }

  constructor({ name, schema, values = [], owner }: {
    name: string;
    schema: SimDataSchema;
    values?: Cell[];
    owner?: SimDataResource;
  }) {
    super(owner);
    this._name = name;
    this._schema = schema;
    this._values = values;
  }

  delete(): void {
    this.owner?.removeInstances(this); // removeInstances() uncaches
  }

  /**
   * Adds values (Cells) to this instance and then uncaches it.
   * 
   * @param values Value cells to add to this schema
   */
  addValues(...values: Cell[]) {
    this.values.push(...values);
    this.uncache();
  }

  /**
   * Removes values (Cells) from this instance and then uncaches it. Values are
   * removed by reference equality, find the exact objects you want to remove
   * and then pass them in to this function.
   * 
   * @param values Value cells to remove from this schema
   */
  removeValues(...values: Cell[]) {
    if(removeFromArray(values, this.values)) this.uncache();
  }

  /**
   * Allows you to alter the values in a way that uncaches the instance for you.
   * 
   * @param fn Callback function in which you can alter the values
   */
  updateValues(fn: (values: Cell[]) => void) {
    fn(this.values);
    this.uncache();
  }
}
