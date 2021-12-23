import { removeFromArray } from "../../../utils/helpers";
import CacheableModel from "../../abstract/cacheableModel";
import type { SimDataSchema } from "./fragments";
import { SimDataType } from "./simDataTypes";

//#region SimDataType Groupings

type SimDataNumber = 
  SimDataType.Int8 |
  SimDataType.UInt8 |
  SimDataType.Int16 |
  SimDataType.UInt16 |
  SimDataType.Int32 |
  SimDataType.UInt32 |
  SimDataType.Float |
  SimDataType.LocalizationKey;

type SimDataBigInt = 
  SimDataType.Int64 |
  SimDataType.UInt64 |
  SimDataType.TableSetReference;

type SimDataText =
  SimDataType.Character |
  SimDataType.String |
  SimDataType.HashedString;

//#endregion SimDataType Groupings

//#region Cells

export abstract class Cell extends CacheableModel {
  public owner?: Cell;

  constructor(readonly dataType: SimDataType, owner?: Cell) {
    super(owner);
  }

  /**
   * Adds values to this cell, if it can contain other cells. If this cell
   * doesn't support recursive values, an exception is thrown.
   * 
   * @param cells Cells to add to this one
   */
  abstract add(...cells: Cell[]): void;

  /**
   * Removes values from this cell, if it can contain other cells. If this cell
   * doesn't support recursive values, an exception is thrown. Cells are removed
   * by reference equality. Find the exact objects to remove and then pass them
   * in to this function (or, call their `delete()` method).
   * 
   * @param cells Cells to add to this one
   */
  abstract remove(...cells: Cell[]): void;

  /**
   * Removes this cell from its owner, if it has one.
   */
  delete(): void {
    this.owner?.remove?.(this);
  }

  /**
   * Verifies that this cell's content is valid, and if it isn't, an exception
   * is thrown.
   */
  validate(): void {}
}

abstract class NonRecursiveCell extends Cell {
  add(...cells: Cell[]): void {
    throw new Error(`Cannot add to this cell: ${this}`);
  }

  remove(...cells: Cell[]): void {
    throw new Error(`Cannot remove from this cell: ${this}`);
  }
}

abstract class SingleValueCell<T> extends NonRecursiveCell {
  constructor(dataType: SimDataType, public value: T, owner?: Cell) {
    super(dataType, owner);
    this._watchProps('value');
  }
}

export class TextCell extends SingleValueCell<string> {
  readonly dataType: SimDataText;

  constructor(dataType: SimDataText, value: string, owner?: Cell) {
    super(dataType, value, owner);
  }

  validate() {
    if (!this.value) throw new Error("Text cell must be a non-empty string.");
  }
}

export class NumberCell extends SingleValueCell<number> {
  readonly dataType: SimDataNumber;

  constructor(dataType: SimDataNumber, value: number, owner?: Cell) {
    super(dataType, value, owner);
  }

  // TODO: Validate between min/max value
}

export class BigIntCell extends SingleValueCell<bigint> {
  readonly dataType: SimDataBigInt;

  constructor(dataType: SimDataBigInt, value: bigint, owner?: Cell) {
    super(dataType, value, owner);
  }

  // TODO: Validate between min/max value
}

export class ResourceKeyCell extends NonRecursiveCell {
  readonly dataType: SimDataType.ResourceKey;

  constructor(public type: number, public group: number, public instance: bigint, owner?: Cell) {
    super(SimDataType.ResourceKey, owner);
    this._watchProps('type', 'group', 'instance');
  }

  // TODO: Validate between min/max value
}

export class Float2Cell extends NonRecursiveCell {
  readonly dataType: SimDataType.Float2;

  constructor(public x: number, public y: number, owner?: Cell) {
    super(SimDataType.Float2, owner);
    this._watchProps('x', 'y');
  }

  // TODO: Validate between min/max value
}

export class Float3Cell extends NonRecursiveCell {
  readonly dataType: SimDataType.Float3;

  constructor(public x: number, public y: number, public z: number, owner?: Cell) {
    super(SimDataType.Float3, owner);
    this._watchProps('x', 'y', 'z');
  }

  // TODO: Validate between min/max value
}

export class Float4Cell extends NonRecursiveCell {
  readonly dataType: SimDataType.Float4;

  constructor(public x: number, public y: number, public z: number, public w: number, owner?: Cell) {
    super(SimDataType.Float4, owner);
    this._watchProps('x', 'y', 'z', 'w');
  }

  // TODO: Validate between min/max value
}

abstract class MultiValueCell<T extends Cell> extends Cell {
  /**
   * The values in this cell. This should not be mutated directly - use the
   * provided methods to add, remove, or edit the values, or else the cache will
   * be off. If you must mutate it in in some unique way, do one of the
   * following:
   * - Mutate the array in the callback of the `update()` method.
   * - Call `uncache()` after making edits.
   * - Assign values to itself (`cell.values = cell.values`) after making edits.
   */
  public values: T[];

  constructor(dataType: SimDataType, values: T[], owner?: Cell) {
    super(dataType, owner);
    this.values = values;
    this._watchProps('values');
  }

  add(...values: T[]) {
    this.values.push(...values);
    this.uncache();
  }

  remove(...values: T[]) {
    if(removeFromArray(values, this.values)) this.uncache();
  }
  
  /**
   * Sets the value at the given index.
   * 
   * @param index Index of value to set
   * @param value Value to set
   */
  set(index: number, value: T) {
    this.values[index] = value;
    this.uncache();
  }

  /**
   * Provides a context in which the values can be mutated safely, as it will
   * be uncached afterwards.
   * 
   * @param fn Callback function in which values can be mutated
   */
  update(fn: (values: T[]) => void) {
    fn(this.values);
    this.uncache();
  }

  validate(): void {
    this.values.forEach(value => value.validate());
  }
}

export class ObjectCell extends MultiValueCell<Cell> {
  readonly dataType: SimDataType.Object;

  constructor(public schema: SimDataSchema, values: Cell[], owner?: Cell) {
    super(SimDataType.Object, values, owner);
    this._watchProps('schema');
  }

  validate(): void {
    if (this.schema) {
      this.schema.columns.forEach((column, index) => {
        const value = this.values[index];
        if (!value)
          throw new Error(`Missing value for column with name "${column.name}"`);
        if (value.dataType !== column.type)
          throw new Error(`Value's type does not match its column: ${value.dataType} ≠ ${column.type}`);
      });

      super.validate();
    } else {
      throw new Error("Schema must be specified for object cell.");
    }
  }
}

export class VectorCell<T extends Cell> extends MultiValueCell<T> {
  readonly dataType: SimDataType.Vector;

  constructor(values: T[], owner?: Cell) {
    super(SimDataType.Vector, values, owner);
  }

  validate(): void {
    if (this.values.length > 0) {
      const childType = this.values[0].dataType;
      this.values.forEach(child => {
        if (child.dataType !== childType) {
          throw new Error(`Not all vector children have the same time: ${childType} ≠ ${child.dataType}`);
        }
      });

      super.validate();
    }
  }
}

export class VariantCell extends SingleValueCell<Cell> {
  readonly dataType: SimDataType.Variant;

  constructor(public value: Cell, owner?: Cell) {
    super(SimDataType.Variant, owner);
    value.owner = this;
  }

  validate(): void {
    this.value?.validate();
  }
}

//#endregion Cells
