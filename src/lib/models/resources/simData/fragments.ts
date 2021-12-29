import type SimDataResource from "./simDataResource";
import type { Cell } from "./cells";
import { ObjectCell } from "./cells";
import CacheableModel from "../../abstract/cacheableModel";
import { SimDataType } from "./simDataTypes";
import { removeFromArray } from "../../../utils/helpers";

/**
 * A schema that objects in a SimData can follow.
 */
export class SimDataSchema extends CacheableModel {
  owner?: SimDataResource;
  private _columns: SimDataSchemaColumn[];

  /**
   * The columns in this schema. Individual columns can be mutated and cacheing
   * will be handled (e.g. `columns[0].name = "col_name"` is perfectly safe),
   * however, mutating the array itself by adding or removing columns should be
   * avoided whenever possible, because doing so is a surefire way to mess up
   * the cache. 
   * 
   * To add or remove columns, use the `addColumns()` and `removeColumns()`
   * methods, or you may also call `delete()` on the column you wish to remove.
   * 
   * If you insist on removing from or sorting the array manually, you can, as
   * long as you remember to call `uncache()` when you are done. If you insist
   * on adding columns manually, it's your funeral.
   */
  get columns() { return this._columns; }

  constructor(public name: string, public hash: number, columns: SimDataSchemaColumn[], owner?: SimDataResource) {
    super(owner);
    this._columns = columns || [];
    this.columns.forEach(column => column.owner = this);
    this._watchProps('name', 'hash');
  }

  /**
   * Adds columns to this schema and uncaches it. The provided arguments can
   * either be instances of SimDataSchemaColumn or plain JS objects with `name`
   * and `type` properties.
   * 
   * @param columns Columns to add to this schema
   */
  addColumns(...columns: {
    name: string;
    type: SimDataType;
    flags?: number;
  }[]) {
    columns.forEach(({ name, type, flags = 0 }) => {
      this.columns.push(new SimDataSchemaColumn(name, type, flags, this));
    });
    this.uncache();
  }

  /**
   * Removes the given columns from this schema and then uncaches it. Columns
   * are removed by reference equality, so the given objects must be the exact
   * objects that exist in this SimData.
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
 * A column in a SimData schema.
 */
export class SimDataSchemaColumn extends CacheableModel {
  owner?: SimDataSchema;

  constructor(public name: string, public type: SimDataType, public flags: number, owner?: SimDataSchema) {
    super(owner);
    this._watchProps('name', 'type', 'flags');
  }

  delete(): void {
    this.owner?.removeColumns(this); // removeColumns() uncaches
  }
}

/**
 * A top-level object cell with a name. These are the only cells that appear in
 * a SimData XML, so these are the models that users are familiar with.
 */
export class SimDataInstance extends ObjectCell {
  owner?: SimDataResource;

  constructor(public name: string, schema: SimDataSchema, values: Cell[], owner?: SimDataResource) {
    super(schema, values, owner);
    this._watchProps('name');
  }

  delete(): void {
    this.owner?.removeInstances(this); // removeInstances() uncaches
  }
}
