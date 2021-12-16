import type SimDataResource from "./simDataResource";
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

abstract class SimDataValue extends SimDataFragment {
  abstract readonly type: SimDataType;

  delete(): void {} // TODO: delete
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

export class SimDataInstance extends SimDataObjectValue {
  name: string;
}
