import type { SimDataSchema } from "./fragments";
import CacheableModel from "../../abstract/cacheableModel";
import { SimDataType } from "./simDataTypes";
import { removeFromArray } from "../../../utils/helpers";

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

type SingleValueCellType = boolean | number | bigint | string | Cell;

//#endregion SimDataType Groupings

//#region Abstract Cells

/**
 * A value that appears in a SimData table.
 */
export abstract class Cell extends CacheableModel {
  constructor(public readonly dataType: SimDataType, owner?: CacheableModel) {
    super(owner);
  }

  /**
   * Verifies that this cell's content is valid, and if it isn't, an exception
   * is thrown.
   */
  abstract validate(): void;

  /**
   * Creates a deep copy of this cell, retaining all information except for
   * the owner.
   */
  abstract clone(): Cell;

  /**
   * Deletes this cell from its owning cell, if it has one.
   */
  delete(): void {
    (this.owner as MultiValueCell<Cell>)?.removeValues?.(this);
  }
}

/**
 * A SimData cell that contains a single value. This value can either be a
 * number, bigint, string, boolean, or another cell.
 */
abstract class SingleValueCell<T extends SingleValueCellType> extends Cell {
  constructor(dataType: SimDataType, public value: T, owner?: CacheableModel) {
    super(dataType, owner);
    if (value instanceof CacheableModel) value.owner = this;
    this._watchProps('value');
  }
}

/**
 * A SimData cell that contains other cells of the same type.
 */
abstract class MultiValueCell<T extends Cell> extends Cell {
  /**
   * The values in this cell. Individual values can be mutated and cacheing will
   * be handled (e.g. `values[0].value = 5` is perfectly safe), however,
   * mutating the array itself by adding, removing, or setting values should be
   * avoided whenever possible, because doing so is a surefire way to mess up
   * the cache. 
   * 
   * To add, remove, or set values, use the `addValues()`, `removeValues()`, and
   * `setValues()` methods.
   * 
   * If you insist on removing or setting values manually, you can, as long as
   * you remember to call `uncache()` when you are done. If you insist on adding
   * values manually, it's your funeral. Doing so will likely mess up ownership.
   */
  public values: T[];

  constructor(dataType: SimDataType, values: T[], owner?: CacheableModel) {
    super(dataType, owner);
    this.values = values;
    this._watchProps('values');
  }

  /**
   * Values (cells) to add. Make sure that the cells being added do not already
   * belong to another model, or else their cache ownership will be broken.
   * If adding cells that belong to another model, use `addValueClones()`.
   * 
   * @param values Values to add to this cell
   */
  addValues(...values: T[]) {
    values.forEach(cell => {
      cell.owner = this;
      this.values.push(cell);
    });

    this.uncache();
  }

  /**
   * Values (cells) to add. Each cell will be cloned before it is added,
   * ensuring that the cache ownership of the original values is kept intact.
   * 
   * @param values Values to clone and add to this cell
   */
  addValueClones(...values: T[]) {
    //@ts-expect-error The cell clones are guaranteed to be of type T
    this.addValues(...(values.map(cell => cell.clone())));
  }

  /**
   * Values (cells) to remove. All cells are objects, and they are removed by
   * reference equality. You must pass in the exact objects you want to remove.
   * 
   * @param values Values to add to this cell
   */
  removeValues(...values: T[]) {
    if(removeFromArray(values, this.values)) this.uncache();
  }
  
  /**
   * Sets the value at the given index.
   * 
   * @param index Index of value to set
   * @param value Value to set
   */
  setValue(index: number, value: T) {
    this.values[index] = value;
    this.uncache();
  }

  validate(): void {
    this.values.forEach(value => value.validate());
  }
}

//#endregion Abstract Cells

//#region Cells

/**
 * A cell that contains a boolean value.
 */
export class BooleanCell extends SingleValueCell<boolean> {
  readonly dataType: SimDataType.Boolean;

  constructor(value: boolean, owner?: CacheableModel) {
    super(SimDataType.Boolean, value, owner);
  }

  validate(): void { }

  clone(): BooleanCell {
    return new BooleanCell(this.value);
  }
}

/**
 * A cell that contains any kind of text, such as a string or character.
 */
export class TextCell extends SingleValueCell<string> {
  readonly dataType: SimDataText;

  constructor(dataType: SimDataText, value: string, owner?: CacheableModel) {
    super(dataType, value, owner);
  }

  validate(): void {
    if (!this.value) throw new Error("Text cell must be a non-empty string.");
  }

  clone(): TextCell {
    return new TextCell(this.dataType, this.value);
  }
}

/**
 * A cell that contains any numerical value that can fit in an ES number. This
 * includes all integers 32-bit and smaller, floats, and localization keys.
 */
export class NumberCell extends SingleValueCell<number> {
  readonly dataType: SimDataNumber;

  constructor(dataType: SimDataNumber, value: number, owner?: CacheableModel) {
    super(dataType, value, owner);
  }

  validate(): void {
    // TODO: impl
  }

  clone(): NumberCell {
    return new NumberCell(this.dataType, this.value);
  }
}

/**
 * A cell that contains any numerical value that requires 64 bits or higher.
 * This includes 64-bit integers and table set references.
 */
export class BigIntCell extends SingleValueCell<bigint> {
  readonly dataType: SimDataBigInt;

  constructor(dataType: SimDataBigInt, value: bigint, owner?: CacheableModel) {
    super(dataType, value, owner);
  }

  validate(): void {
    // TODO: impl
  }

  clone(): BigIntCell {
    return new BigIntCell(this.dataType, this.value);
  }
}

/**
 * A cell that contains a resource key value.
 */
export class ResourceKeyCell extends Cell {
  readonly dataType: SimDataType.ResourceKey;

  constructor(public type: number, public group: number, public instance: bigint, owner?: CacheableModel) {
    super(SimDataType.ResourceKey, owner);
    this._watchProps('type', 'group', 'instance');
  }

  validate(): void {
    // TODO: impl
  }

  clone(): ResourceKeyCell {
    return new ResourceKeyCell(this.type, this.group, this.instance);
  }
}

/**
 * A cell that contains two floating point numbers.
 */
export class Float2Cell extends Cell {
  readonly dataType: SimDataType.Float2;

  constructor(public x: number, public y: number, owner?: CacheableModel) {
    super(SimDataType.Float2, owner);
    this._watchProps('x', 'y');
  }

  validate(): void { }

  clone(): Float2Cell {
    return new Float2Cell(this.x, this.y);
  }
}

/**
 * A cell that contains three floating point numbers.
 */
export class Float3Cell extends Cell {
  readonly dataType: SimDataType.Float3;

  constructor(public x: number, public y: number, public z: number, owner?: CacheableModel) {
    super(SimDataType.Float3, owner);
    this._watchProps('x', 'y', 'z');
  }

  validate(): void { }

  clone(): Float3Cell {
    return new Float3Cell(this.x, this.y, this.z);
  }
}

/**
 * A cell that contains four floating point numbers.
 */
export class Float4Cell extends Cell {
  readonly dataType: SimDataType.Float4;

  constructor(public x: number, public y: number, public z: number, public w: number, owner?: CacheableModel) {
    super(SimDataType.Float4, owner);
    this._watchProps('x', 'y', 'z', 'w');
  }

  validate(): void { }

  clone(): Float4Cell {
    return new Float4Cell(this.x, this.y, this.z, this.w);
  }
}

/**
 * A cell that contains rows that line up with schema columns.
 */
export class ObjectCell extends MultiValueCell<Cell> {
  readonly dataType: SimDataType.Object;

  constructor(public schema: SimDataSchema, values: Cell[], owner?: CacheableModel) {
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

  clone(): ObjectCell {
    return new ObjectCell(this.schema, this.values.map(cell => cell.clone()));
  }
}

/**
 * A cell that contains a list of values of the same type.
 */
export class VectorCell<T extends Cell> extends MultiValueCell<T> {
  readonly dataType: SimDataType.Vector;

  constructor(values: T[], owner?: CacheableModel) {
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

  clone(): VectorCell {
    return new VectorCell(this.values.map(cell => cell.clone()));
  }
}

/**
 * A cell that may contain another cell.
 */
export class VariantCell extends SingleValueCell<Cell> {
  readonly dataType: SimDataType.Variant;

  constructor(value: Cell, owner?: CacheableModel) {
    super(SimDataType.Variant, value, owner);
  }

  validate(): void {
    this.value?.validate();
  }

  clone(): VariantCell {
    return new VariantCell(this.value?.clone());
  }
}

//#endregion Cells
