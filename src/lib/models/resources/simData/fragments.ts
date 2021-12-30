import type SimDataResource from "./simDataResource";
import type { Cell, CellCloneOptions } from "./cells";
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
   * Adds columns to this schema and uncaches it. The provided columns should
   * be new objects (i.e. columns that are not already part of another schema).
   * If you want to copy columns from another schema, use `addColumnClones()`
   * instead, so as to not affect the internal cache.
   * 
   * @param columns Columns to add to this schema
   */
  addColumns(...columns: SimDataSchemaColumn[]) {
    columns.forEach(({ name, type, flags = 0 }) => {
      this.columns.push(new SimDataSchemaColumn(name, type, flags, this));
    });

    this.uncache();
  }

  /**
   * Clones and adds the given columns to this schema. This method ensures that
   * the columns that get added are new objects, so as to avoid cacheing issues.
   * 
   * @param columns Columns to add to this schema
   */
  addColumnClones(...columns: SimDataSchemaColumn[]) {
    this.addColumns(...(columns.map(column => column.clone())));
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

  /**
   * Removes this schema from its owning SimDataResource, if it has one.
   */
  delete() {
    this.owner?.removeSchemas(this); // removeSchemas() uncaches
  }

  /**
   * Creates a deep copy of this schema, with all values except for owner being
   * copied over.
   */
  clone(): SimDataSchema {
    return new SimDataSchema(this.name, this.hash, this.columns.map(column => column.clone()));
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

  /**
   * Removes this column from its owning SimDataSchema, if it has one.
   */
  delete(): void {
    this.owner?.removeColumns(this); // removeColumns() uncaches
  }

  /**
   * Creates a deep copy of this column, with all values except for owner being
   * copied over.
   */
  clone(): SimDataSchemaColumn {
    return new SimDataSchemaColumn(this.name, this.type, this.flags);
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

  /**
   * Removes this instance from its owning SimDataResource, if it has one.
   */
  delete(): void {
    this.owner?.removeInstances(this); // removeInstances() uncaches
  }

  clone(options?: CellCloneOptions): SimDataInstance {
    const { schema, values } = this._internalClone(options);
    return new SimDataInstance(this.name, schema, values);
  }
}
