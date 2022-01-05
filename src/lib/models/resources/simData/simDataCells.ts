import type { SimDataSchema } from "./simDataFragments";
import type { SimDataNumber, SimDataBigInt, SimDataText, SimDataFloatVector } from "./simDataTypes";
import type { BinaryDecoder, BinaryEncoder } from "../../../utils/encoding";
import { CellCloneOptions, CellEncodingOptions, CellToXmlOptions, ObjectCellRow } from "./shared";
import CacheableModel from "../../abstract/cacheableModel";
import { SimDataType, SimDataTypeUtils } from "./simDataTypes";
import { removeFromArray } from "../../../utils/helpers";
import { XmlElementNode, XmlNode, XmlValueNode } from "../../xml/dom";
import { formatAsHexString } from "../../../utils/formatting";
import { fnv32 } from "../../../utils/hashing";

type PrimitiveType = boolean | number | bigint | string;

//#region Abstract Cells

/**
 * A value that appears in a SimData table.
 */
export abstract class Cell extends CacheableModel {
  constructor(public readonly dataType: SimDataType, owner?: CacheableModel) {
    super(owner);
  }

  /**
   * Creates a deep copy of this cell, retaining all information except for
   * the owner. Everything contained and owned by this cell will also be
   * cloned, except for the schema of any objects. If you need to clone the
   * schemas, set `cloneSchema: true`.
   * 
   * Options
   * - `cloneSchema`: Whether or not the schema reference by this cell should
   * be cloned. Default is `false`.
   * 
   * @param options Options for cloning
   */
  abstract clone(options?: CellCloneOptions): Cell;

  /**
   * Writes this cell's value(s) into the given encoder at the current position.
   * If this cell is recursive, then the `offset` option MUST be supplied, or an
   * exception will be thrown. Note that contained cells will NOT be encoded,
   * just the offset to the contained cell.
   * 
   * Options
   * - `offset`: Required if this cell is recursive. References another position
   * in a binary SimData file.
   * 
   * @param encoder Encoder to write this cell into
   * @param options Additional parameters need to encode this cell
   */
  abstract encode(encoder: BinaryEncoder, options?: CellEncodingOptions): void;

  /**
   * Creates an XmlElementNode object that represents this cell as it would
   * appear within an S4S-style XML SimData document.
   */
  abstract toXmlNode(options?: CellToXmlOptions): XmlElementNode;

  /**
   * Verifies that this cell's content is valid, and if it isn't, an exception
   * is thrown with the reason why it is invalid.
   * 
   * Options
   * - `ignoreCache`: Whether or not cache should be validated. Feel free to
   *   set this to `true` if you're just reading or generating SimDatas, the
   *   only time cache really matters is when you're editing SimDatas. Default
   *   value is `false`.
   * 
   * @param options Options for validation
   * @throws If this cell is not in a valid state
   */
  abstract validate(options?: { ignoreCache?: boolean; }): void;

  //#region Protected Methods

  /**
   * Returns the `offset` option, or throws an exception if it's not set.
   * 
   * @param options Options for encoding
   */
  protected _getOffsetEncodingOption(options: CellEncodingOptions): number {
    if (!options?.offset)
      throw new Error(`DataType ${this.dataType} cannot be encoded without an offset.`);
    return options.offset;
  }

  /**
   * Gets the attributes to use when serializing this cell as XML.
   * 
   * @param args Arguments to get XML attributes
   */
  protected _xmlAttributes({ nameAttr = undefined, typeAttr = false }: CellToXmlOptions = {}): { [key: string]: string; } {
    const attributes: { [key: string]: any; } = {};
    if (nameAttr !== undefined) attributes.name = nameAttr;
    if (typeAttr)
      attributes.type = SimDataTypeUtils.getSims4StudioName(this.dataType);
    return attributes;
  }

  //#endregion Protected Methods

  //#region Static Methods

  /*
    TODO: These static methods should be included here, but TS does not support
    abstract static methods. This feature request is tracked here:

    https://github.com/microsoft/TypeScript/issues/34516

    If it is added to TS, these methods should be included on this class:
    - abstract static decode(decoder: BinaryDecoder): Cell;
    - abstract static fromXmlNode(node: XmlNode): Cell;
    - abstract static getDefault(): Cell;
  */

  /**
   * Parses a cell of the given type from the given node, using the list of
   * schemas to read any objects that it may contain.
   * 
   * @param dataType The type of cell to read
   * @param schemas Schemas that this cell or its children may follow
   * @param node Node to parse as a cell
   */
  static parseXmlNode(dataType: SimDataType, schemas: SimDataSchema[], node: XmlNode): Cell {
    switch (dataType) {
      case SimDataType.Boolean:
        return BooleanCell.fromXmlNode(node);
      case SimDataType.Int8:
      case SimDataType.UInt8:
      case SimDataType.Int16:
      case SimDataType.UInt16:
      case SimDataType.Int32:
      case SimDataType.UInt32:
      case SimDataType.LocalizationKey:
      case SimDataType.Float:
        return NumberCell.fromXmlNode(dataType, node);
      case SimDataType.Int64:
      case SimDataType.UInt64:
      case SimDataType.TableSetReference:
        return BigIntCell.fromXmlNode(dataType, node);
      case SimDataType.Character:
      case SimDataType.String:
      case SimDataType.HashedString:
        return TextCell.fromXmlNode(dataType, node);
      case SimDataType.Float2:
        return Float2Cell.fromXmlNode(node);
      case SimDataType.Float3:
        return Float3Cell.fromXmlNode(node);
      case SimDataType.Float4:
        return Float4Cell.fromXmlNode(node);
      case SimDataType.ResourceKey:
        return ResourceKeyCell.fromXmlNode(node);
      case SimDataType.Object:
        return ObjectCell.fromXmlNode(schemas, node);
      case SimDataType.Vector:
        return VectorCell.fromXmlNode(schemas, node);
      case SimDataType.Variant:
        return VariantCell.fromXmlNode(schemas, node);
      case SimDataType.Undefined:
      default:
        throw new Error(`Cannot parse a "${dataType}" node as a cell.`);
    }
  }

  //#endregion Static Methods
}

/**
 * A SimData cell that contains a single value. This value can either be a
 * number, bigint, string, boolean, or another cell.
 */
abstract class PrimitiveValueCell<T extends PrimitiveType> extends Cell {
  constructor(dataType: SimDataType, public value: T, owner?: CacheableModel) {
    super(dataType, owner);
    this._watchProps('value');
  }

  toXmlNode(options: CellToXmlOptions = {}): XmlElementNode {
    return new XmlElementNode({
      tag: "T",
      attributes: this._xmlAttributes(options),
      children: [ this._getXmlValue() ]
    });
  }

  /**
   * Gets the value to nest within the XML node for this cell.
   */
  protected abstract _getXmlValue(): XmlValueNode;
}

/**
 * A SimData cell that contains multiple 4-byte floats.
 */
abstract class FloatVectorCell extends Cell {
  readonly dataType: SimDataFloatVector;
  protected _floatNames: string[];

  constructor(dataType: SimDataFloatVector, public x: number, public y: number, owner?: CacheableModel) {
    super(dataType, owner);
    this._floatNames = ['x', 'y'];
    this._watchProps('x', 'y');
  }

  encode(encoder: BinaryEncoder, options?: CellEncodingOptions): void {
    this._floatNames.forEach(floatName => encoder.float(this[floatName]));
  }
  
  toXmlNode(options: CellToXmlOptions = {}): XmlElementNode {
    const floatsString = this._floatNames.map(f => this[f].toString()).join(',');

    return new XmlElementNode({
      tag: "T",
      attributes: this._xmlAttributes(options),
      children: [ new XmlValueNode(floatsString) ]
    });
  }

  validate(): void {
    this._floatNames.forEach(floatName => {
      if (!SimDataTypeUtils.isNumberInRange(this[floatName], SimDataType.Float)) {
        throw new Error(`Float vector contains a value that is not a 4-byte float: ${this[floatName]}`);
      }
    });
  }

  protected static _parseFloatsFromNode(node: XmlNode, count: number): number[] {
    const floatStrings = (node.innerValue as string).split(",");
    if (floatStrings.length !== count)
      throw new Error(`Expected Float${count}Cell to contain ${count} floats separated by ',', but got ${node.innerValue}`);
    return floatStrings.map(s => {
      const float = parseFloat(s);
      if (float === NaN)
        throw new Error(`Expected Float${count}Cell value to be a float, but got ${s}.`);
      return float;
    });
  }
}

//#endregion Abstract Cells

//#region Cells

/**
 * A cell that contains a boolean value.
 */
export class BooleanCell extends PrimitiveValueCell<boolean> {
  readonly dataType: SimDataType.Boolean;

  constructor(value: boolean, owner?: CacheableModel) {
    super(SimDataType.Boolean, value ?? false, owner);
  }

  clone(): BooleanCell {
    return new BooleanCell(this.value);
  }

  encode(encoder: BinaryEncoder, options?: CellEncodingOptions): void {
    this.validate();
    encoder.boolean(this.value);
  }

  validate(): void {
    if (this.value == undefined) {
      throw new Error(`Boolean cell value cannot be undefined or null.`);
    }
  }

  protected _getXmlValue(): XmlValueNode {
    return new XmlValueNode(this.value ? 1 : 0);
  }

  //#region Static Methods

  /**
   * Creates a BooleanCell by reading a boolean value from the decoder.
   * 
   * @param decoder Decoder from which to read the corresponding value
   */
  static decode(decoder: BinaryDecoder): BooleanCell {
    return new BooleanCell(decoder.boolean());
  }

  /**
   * Parses a BooleanCell from the given XML node.
   * 
   * @param node Node to parse as a BooleanCell
   */
  static fromXmlNode(node: XmlNode): BooleanCell {
    // type coercion is intentional; strings, number, bigints should be false
    return new BooleanCell(node.innerValue != undefined && node.innerValue != 0);
  }

  /**
   * Creates the default cell for this type.
   */
  static getDefault(): BooleanCell {
    return new BooleanCell(false);
  }

  //#endregion Static Methods
}

/**
 * A cell that contains any kind of text, such as a string or character.
 */
export class TextCell extends PrimitiveValueCell<string> {
  readonly dataType: SimDataText;

  constructor(dataType: SimDataText, value: string, owner?: CacheableModel) {
    super(dataType, value ?? "", owner);
  }

  clone(): TextCell {
    return new TextCell(this.dataType, this.value);
  }

  encode(encoder: BinaryEncoder, options?: CellEncodingOptions): void {
    this.validate();

    if (this.dataType === SimDataType.Character) {
      encoder.charsUtf8(this.value);
    } else {
      // BT uses unsigned, but I'm intentionally signing it here because it can
      // be negative and JS number don't wrap
      encoder.int32(this._getOffsetEncodingOption(options));

      if (this.dataType === SimDataType.HashedString) {
        encoder.uint32(fnv32(this.value));
      }
    }
  }

  validate(): void {
    if (this.dataType === SimDataType.Character) {
      if (Buffer.byteLength(this.value) !== 1) {
        throw new Error(`Character cell may only occupy one byte, but contains "${this.value}"`);
      }
    } else {
      if (this.value == undefined) {
        throw new Error(`String cell cannot contain undefined or null.`);
      }
    }
  }

  protected _getXmlValue(): XmlValueNode {
    return new XmlValueNode(this.value);
  }

  //#region Static Methods

  /**
   * Creates a TextCell by reading the appropriate content at the current
   * position in the given decoder. String and HashedString content at the
   * given position will be read, but the decoder's final position will be left
   * at the end of the cell itself.
   * 
   * @param dataType Type of text cell to create
   * @param decoder Decoder from which to read the corresponding value
   */
  static decode(dataType: SimDataText, decoder: BinaryDecoder): TextCell {
    function getValue(): string {
      if (dataType === SimDataType.Character) return decoder.charsUtf8(1);

      // BT uses uint32 for offset, but I'm intentionally using an int32
      // because the value CAN be negative, and JS numbers don't wrap
      const pos = decoder.tell() + decoder.int32();

      // don't need to read the hash of hashed strings, because it can/will be
      // calculated later anyways
      if (dataType === SimDataType.HashedString) decoder.skip(4);

      return decoder.savePos<string>(() => {
        decoder.seek(pos);
        return decoder.string();
      });
    }

    return new TextCell(dataType, getValue());
  }

  /**
   * Parses a TextCell from the given XML node.
   * 
   * @param dataType Type of TextCell to parse
   * @param node Node to parse as a TextCell
   */
  static fromXmlNode(dataType: SimDataText, node: XmlNode): TextCell {
    const value: string = (node.innerValue ?? "") as string;
    return new TextCell(dataType, value);
  }

  /**
   * Creates the default cell for this type, given a data type.
   * 
   * @param dataType Type of TextCell to create
   */
  static getDefault(dataType: SimDataText): TextCell {
    return new TextCell(dataType, "");
  }

  //#endregion Static Methods
}

/**
 * A cell that contains any numerical value that can fit in an ES number. This
 * includes all integers 32-bit and smaller, floats, and localization keys.
 */
export class NumberCell extends PrimitiveValueCell<number> {
  readonly dataType: SimDataNumber;

  constructor(dataType: SimDataNumber, value: number, owner?: CacheableModel) {
    super(dataType, value ?? 0, owner);
  }
  
  clone(): NumberCell {
    return new NumberCell(this.dataType, this.value);
  }

  encode(encoder: BinaryEncoder, options?: CellEncodingOptions): void {
    this.validate();

    switch (this.dataType) {
      case SimDataType.Int8:
        encoder.int8(this.value);
        break;
      case SimDataType.UInt8:
        encoder.uint8(this.value);
        break;
      case SimDataType.Int16:
        encoder.int16(this.value);
        break;
      case SimDataType.UInt16:
        encoder.uint16(this.value);
        break;
      case SimDataType.Int32:
        encoder.int32(this.value);
        break;
      case SimDataType.LocalizationKey:
        // fallthrough
      case SimDataType.UInt32:
        encoder.uint32(this.value);
        break;
      case SimDataType.Float:
        encoder.float(this.value);
        break;
    }
  }

  validate(): void {
    if (!SimDataTypeUtils.isNumberInRange(this.value, this.dataType)) {
      throw new Error(`Value of ${this.value} is not within the range of ${this.dataType}.`);
    }
  }

  protected _getXmlValue(): XmlValueNode {
    if (this.dataType === SimDataType.LocalizationKey) {
      var value = formatAsHexString(this.value, 8, true);
    } else {
      var value = this.value.toString();
    }

    return new XmlValueNode(value);
  }

  //#region Static Methods

  /**
   * Creates a NumberCell by reading a value of the give data type from the
   * given decoder.
   * 
   * @param dataType Type of number cell to create
   * @param decoder Decoder from which to read the corresponding value
   */
  static decode(dataType: SimDataNumber, decoder: BinaryDecoder): NumberCell {
    function getValue(): number {
      switch (dataType) {
        case SimDataType.Int8:
          return decoder.int8();
        case SimDataType.UInt8:
          return decoder.uint8();
        case SimDataType.Int16:
          return decoder.int16();
        case SimDataType.UInt16:
          return decoder.uint16();
        case SimDataType.Int32:
          return decoder.int32();
        case SimDataType.UInt32:
          // fallthrough
        case SimDataType.LocalizationKey:
          return decoder.uint32();
        case SimDataType.Float:
          return decoder.float();
      }
    }

    return new NumberCell(dataType, getValue());
  }

  /**
   * Parses a NumberCell from the given XML node.
   * 
   * @param dataType Type of NumberCell to parse
   * @param node Node to parse as a NumberCell
   */
  static fromXmlNode(dataType: SimDataNumber, node: XmlNode): NumberCell {
    const value = SimDataTypeUtils.parseNumber(node.innerValue, dataType);
    
    if (Number.isNaN(value)) {
      throw new Error(`Expected NumberCell to contain a number, but got "${node.innerValue}".`);
    } else {
      return new NumberCell(dataType, value);
    }
  }

  /**
   * Creates the default cell for this type, given a data type.
   * 
   * @param dataType Type of NumberCell to create
   */
  static getDefault(dataType: SimDataNumber): NumberCell {
    return new NumberCell(dataType, 0);
  }

  //#endregion Static Methods
}

/**
 * A cell that contains any numerical value that requires 64 bits or higher.
 * This includes 64-bit integers and table set references.
 */
export class BigIntCell extends PrimitiveValueCell<bigint> {
  readonly dataType: SimDataBigInt;

  constructor(dataType: SimDataBigInt, value: bigint, owner?: CacheableModel) {
    super(dataType, value, owner);
  }

  clone(): BigIntCell {
    return new BigIntCell(this.dataType, this.value);
  }

  encode(encoder: BinaryEncoder, options?: CellEncodingOptions): void {
    this.validate();

    switch (this.dataType) {
      case SimDataType.Int64:
        encoder.int64(this.value);
        break;
      case SimDataType.UInt64:
        // fallthrough
      case SimDataType.TableSetReference:
        encoder.uint64(this.value);
        break;
    }
  }

  validate(): void {
    if (!SimDataTypeUtils.isBigIntInRange(this.value, this.dataType)) {
      throw new Error(`Value of ${this.value} is not within the range of ${this.dataType}.`);
    }
  }

  protected _getXmlValue(): XmlValueNode {
    return new XmlValueNode(this.value.toString());
  }

  //#region Static Methods

  /**
   * Creates a BigIntCell by reading a value of the give data type from the
   * given decoder.
   * 
   * @param dataType Type of bigint cell to create
   * @param decoder Decoder from which to read the corresponding value
   */
  static decode(dataType: SimDataBigInt, decoder: BinaryDecoder): BigIntCell {
    function getValue(): bigint {
      switch (dataType) {
        case SimDataType.Int64:
          return decoder.int64();
        case SimDataType.UInt64:
          // fallthrough
        case SimDataType.TableSetReference:
          return decoder.uint64();
      }
    }

    return new BigIntCell(dataType, getValue());
  }

  /**
   * Parses a BigIntCell from the given XML node.
   * 
   * @param dataType Type of BigIntCell to parse
   * @param node Node to parse as a BigIntCell
   */
  static fromXmlNode(dataType: SimDataBigInt, node: XmlNode): BigIntCell {
    try {
      if (node.innerValue == undefined) {
        return BigIntCell.getDefault(dataType);
      } else {
        return new BigIntCell(dataType, BigInt(node.innerValue));
      }
    } catch (e) {
      throw new Error(`Expected BigIntCell to contain a bigint, but got "${node.innerValue}"`);
    }
  }

  /**
   * Creates the default cell for this type, given a data type.
   * 
   * @param dataType Type of BigIntCell to create
   */
  static getDefault(dataType: SimDataBigInt): BigIntCell {
    return new BigIntCell(dataType, 0n);
  }

  //#endregion Static Methods
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

  clone(): ResourceKeyCell {
    return new ResourceKeyCell(this.type, this.group, this.instance);
  }

  encode(encoder: BinaryEncoder, options?: CellEncodingOptions): void {
    this.validate();

    encoder.uint64(this.instance);
    encoder.uint32(this.type);
    encoder.uint32(this.group);
  }

  toXmlNode(options: CellToXmlOptions = {}): XmlElementNode {
    const type = formatAsHexString(this.type, 8, false);
    const group = formatAsHexString(this.group, 8, false);
    const instance = formatAsHexString(this.instance, 16, false);

    return new XmlElementNode({
      tag: "T",
      attributes: this._xmlAttributes(options),
      children: [
        new XmlValueNode(`${type}-${group}-${instance}`)
      ]
    });
  }

  validate(): void {
    if (!SimDataTypeUtils.isNumberInRange(this.type, SimDataType.UInt32))
      throw new Error(`ResourceKeyCell's type is not a UInt32: ${this.type}`);
    if (!SimDataTypeUtils.isNumberInRange(this.group, SimDataType.UInt32))
      throw new Error(`ResourceKeyCell's group is not a UInt32: ${this.group}`);
    if (!SimDataTypeUtils.isBigIntInRange(this.instance, SimDataType.TableSetReference))
      throw new Error(`ResourceKeyCell's instance is not a UInt64: ${this.instance}`);
  }

  //#region Static Methods

  /**
   * Creates a ResourceKeyCell by reading its values from the decoder.
   * 
   * @param decoder Decoder from which to read the values
   */
  static decode(decoder: BinaryDecoder): ResourceKeyCell {
    const instance = decoder.uint64();
    const type = decoder.uint32();
    const group = decoder.uint32();
    return new ResourceKeyCell(type, group, instance);
  }

  /**
   * Parses a ResourceKeyCell from the given XML node.
   * 
   * @param node Node to parse as a ResourceKeyCell
   */
  static fromXmlNode(node: XmlNode): ResourceKeyCell {
    const numStrings = (node.innerValue as string).split("-");
    if (numStrings.length !== 3)
      throw new Error(`Expected ResourceKeyCell to contain type, group, and instance separated by '-', but got ${node.innerValue}`);

    const type = parseInt(numStrings[0], 16);
    if (Number.isNaN(type))
      throw new Error(`Expected ResourceKeyCell's type to be a number, but got ${numStrings[0]}`);

    const group = parseInt(numStrings[1], 16);
    if (Number.isNaN(group))
      throw new Error(`Expected ResourceKeyCell's group to be a number, but got ${numStrings[1]}`);
    
    try {
      const instance = BigInt(`0x${numStrings[2]}`);
      return new ResourceKeyCell(type, group, instance);
    } catch (e) {
      throw new Error(`Expected ResourceKeyCell's instance to be a bigint, but got ${numStrings[2]}`);
    }
  }

  /**
   * Creates the default cell for this type.
   */
  static getDefault(): ResourceKeyCell {
    return new ResourceKeyCell(0, 0, 0n);
  }

  //#endregion Static Methods
}

/**
 * A cell that contains two floating point numbers.
 */
export class Float2Cell extends FloatVectorCell {
  readonly dataType: SimDataType.Float2;

  constructor(x: number, y: number, owner?: CacheableModel) {
    super(SimDataType.Float2, x, y, owner);
  }

  clone(): Float2Cell {
    return new Float2Cell(this.x, this.y);
  }

  //#region Static Methods

  /**
   * Creates a Float2Cell by reading its values from the decoder.
   * 
   * @param decoder Decoder from which to read the values
   */
  static decode(decoder: BinaryDecoder): Float2Cell {
    return new Float2Cell(decoder.float(), decoder.float());
  }

  /**
   * Parses a Float2Cell from the given XML node.
   * 
   * @param node Node to parse as a Float2Cell
   */
  static fromXmlNode(node: XmlNode): Float2Cell {
    const floats = FloatVectorCell._parseFloatsFromNode(node, 2);
    return new Float2Cell(floats[0], floats[1]);
  }

  /**
   * Creates the default cell for this type.
   */
  static getDefault(): Float2Cell {
    return new Float2Cell(0, 0);
  }

  //#endregion Static Methods
}

/**
 * A cell that contains three floating point numbers.
 */
export class Float3Cell extends FloatVectorCell {
  readonly dataType: SimDataType.Float3;

  constructor(x: number, y: number, public z: number, owner?: CacheableModel) {
    super(SimDataType.Float3, x, y, owner);
    this._floatNames.push('z');
    this._watchProps('z');
  }

  clone(): Float3Cell {
    return new Float3Cell(this.x, this.y, this.z);
  }

  //#region Static Methods

  /**
   * Creates a Float3Cell by reading its values from the decoder.
   * 
   * @param decoder Decoder from which to read the values
   */
  static decode(decoder: BinaryDecoder): Float3Cell {
    return new Float3Cell(decoder.float(), decoder.float(), decoder.float());
  }

  /**
   * Parses a Float3Cell from the given XML node.
   * 
   * @param node Node to parse as a Float3Cell
   */
  static fromXmlNode(node: XmlNode): Float3Cell {
    const floats = FloatVectorCell._parseFloatsFromNode(node, 3);
    return new Float3Cell(floats[0], floats[1], floats[2]);
  }

  /**
   * Creates the default cell for this type.
   */
  static getDefault(): Float3Cell {
    return new Float3Cell(0, 0, 0);
  }

  //#endregion Static Methods
}

/**
 * A cell that contains four floating point numbers.
 */
export class Float4Cell extends FloatVectorCell {
  readonly dataType: SimDataType.Float4;

  constructor(x: number, y: number, public z: number, public w: number, owner?: CacheableModel) {
    super(SimDataType.Float4, x, y, owner);
    this._floatNames.push('z', 'w');
    this._watchProps('z', 'w');
  }

  clone(): Float4Cell {
    return new Float4Cell(this.x, this.y, this.z, this.w);
  }

  //#region Static Methods

  /**
   * Creates a Float4Cell by reading its values from the decoder.
   * 
   * @param decoder Decoder from which to read the values
   */
  static decode(decoder: BinaryDecoder): Float4Cell {
    return new Float4Cell(decoder.float(), decoder.float(), decoder.float(), decoder.float());
  }

  /**
   * Parses a Float4Cell from the given XML node.
   * 
   * @param node Node to parse as a Float4Cell
   */
  static fromXmlNode(node: XmlNode): Float4Cell {
    const floats = FloatVectorCell._parseFloatsFromNode(node, 4);
    return new Float4Cell(floats[0], floats[1], floats[2], floats[3]);
  }

  /**
   * Creates the default cell for this type.
   */
  static getDefault(): Float4Cell {
    return new Float4Cell(0, 0, 0, 0);
  }

  //#endregion Static Methods
}

/**
 * A cell that contains rows that line up with schema columns.
 */
export class ObjectCell extends Cell {
  readonly dataType: SimDataType.Object;
  private _row: ObjectCellRow;

  /**
   * An object that maps column names to the cells that belong to those columns.
   * Mutating children of this object is safe, as is mutating the object itself.
   * For example, `row.col_name.value = 5` and `row.col_name = new Cell(..)`
   * are both safe in terms of cacheing.
   */
  get row() { return this._row; }
  private set row(row: ObjectCellRow) {
    for (const colName in row) row[colName].owner = this;

    if (row._isProxy) {
      this._row = row;
    } else {
      this._row = new Proxy(row, {
        // FIXME: Does this count deleting?
        set(target: ObjectCellRow, property: string, child: Cell) {
          const ref = Reflect.set(target, property, child);
          child.uncache();
          return ref;
        },
        get(target: ObjectCellRow, property: string) {
          if (property === "_isProxy") return true;
          return target[property];
        }
      });
    }
  }

  /** Shorthand for `Object.keys(this.row).length`. */
  get rowLength() { return Object.keys(this.row).length; }

  /** Shorthand for `this.schema.columns.length`. */
  get schemaLength() { return this.schema.columns.length; }

  constructor(public schema: SimDataSchema, row: ObjectCellRow, owner?: CacheableModel) {
    super(SimDataType.Object, owner);
    this.row = row;
    this._watchProps('schema');
  }

  clone(options?: CellCloneOptions): ObjectCell {
    const { schema, row } = this._internalClone(options);
    return new ObjectCell(schema, row);
  }

  encode(encoder: BinaryEncoder, options?: CellEncodingOptions): void {
    encoder.int32(this._getOffsetEncodingOption(options)); // FIXME: signed or unsigned?
  }

  toXmlNode(options: CellToXmlOptions = {}): XmlElementNode {
    const attributes = this._xmlAttributes(options);
    attributes.schema = this.schema.name;

    return new XmlElementNode({
      tag: "U",
      attributes: attributes,
      children: this.schema.columns.map(column => {
        const cell = this.row[column.name];
        return cell.toXmlNode({ nameAttr: column.name });
      })
    });
  }

  validate({ ignoreCache = false } = {}): void {
    if (this.schema) {
      if (this.schemaLength !== this.rowLength)
        throw new Error(`Length of schema does not match length of row: ${this.schemaLength} ≠ ${this.rowLength}`);

      this.schema.columns.forEach(column => {
        const cell = this.row[column.name];

        if (!cell)
          throw new Error(`Missing cell for column with name "${column.name}"`);

        if (cell.dataType !== column.type)
          throw new Error(`Cell's type does not match its column: ${cell.dataType} ≠ ${column.type}`);

        if (!ignoreCache && cell.owner !== this)
          throw new Error("Cache Problem: Child cell has another owner.");

        cell.validate({ ignoreCache });
      });
    } else {
      throw new Error("Schema must be specified for object cell.");
    }
  }

  //#region Protected Methods

  /**
   * Returns the schema and row for a clone.
   * 
   * @param options Options for cloning
   */
  protected _internalClone({ cloneSchema = false, newSchemas }: CellCloneOptions = {}): {
    schema: SimDataSchema;
    row: ObjectCellRow;
  } {
    if (cloneSchema) {
      var schema = this.schema.clone();
    } else if (newSchemas) {
      var schema = newSchemas.find(schema => schema.hash === this.schema.hash) || this.schema;
    } else {
      var schema = this.schema;
    }

    const row: ObjectCellRow = {};
    for (const columnName in this.row) {
      row[columnName] = this.row[columnName].clone({ cloneSchema, newSchemas });
    }

    return { schema, row };
  }

  //#endregion Protected Methods

  //#region Static Methods

  /**
   * Creates the default cell for this type, given a schema to follow.
   * 
   * @param schema Schema for this ObjectCell to follow
   */
  static getDefault(schema: SimDataSchema): ObjectCell {
    const row: ObjectCellRow = {};
    schema.columns.forEach(column => row[column.name] = undefined);
    return new ObjectCell(schema, row);
  }

  /**
   * Parses a ObjectCell from the given XML node, using the given schemas.
   * 
   * @param schemas Schemas that this object or its children may follow
   * @param node Node to parse as a ObjectCell
   */
  static fromXmlNode(schemas: SimDataSchema[], node: XmlNode): ObjectCell {
    const { schema, row } = ObjectCell._parseXmlNode(schemas, node);
    return new ObjectCell(schema, row);
  }

  protected static _parseXmlNode(schemas: SimDataSchema[], node: XmlNode): { schema: SimDataSchema, row: ObjectCellRow } {
    const schema = schemas.find(schema => schema.name === node.attributes.schema);
    if (!schema)
      throw new Error(`Missing a schema with the name "${node.attributes.schema}".`);

    const namedChildNodes: { [key: string]: XmlNode; } = {};
    node.children.forEach(child => {
      if (!child.attributes.name)
        throw new Error(`${schema} Object contains a column without a name.`);
      if (child.attributes.name in namedChildNodes)
        throw new Error(`${schema} Object contains more than one column named "${child.attributes.name}".`);
      namedChildNodes[child.attributes.name] = child;
    });

    const row: ObjectCellRow = {};
    schema.columns.forEach(column => {
      const child = namedChildNodes[column.name];
      if (!child)
        throw new Error(`${schema} Object is missing its "${column.name}" column.`);
      const cell = Cell.parseXmlNode(column.type, schemas, child);
      row[column.name] = cell;
    });

    return { schema, row };
  }

  //#endregion Static Methods
}

/**
 * A cell that contains a list of values of the same type.
 */
export class VectorCell<T extends Cell = Cell> extends Cell {
  readonly dataType: SimDataType.Vector;
  private _children: T[];

  /**
   * The children of this cell. Individual child cells can be mutated and
   * cacheing will be handled (e.g. `children[0].value = 5` is perfectly safe),
   * however, mutating the array itself by adding, removing, or setting children
   * should be avoided whenever possible, because doing so is a surefire way to
   * mess up the cache. 
   * 
   * To add, remove, or set children, use the `addChildren()`,
   * `addChildClones()`, `removeChildren()`, and `setChild()` methods.
   * 
   * If you insist on removing or setting children manually, you can, as long as
   * you remember to call `uncache()` when you are done. If you insist on adding
   * children manually, it's your funeral.
   */
  get children() {
    return this._children;
  }

  private set children(children: T[]) {
    this._children = children;
    children.forEach(child => child.owner = this);
  }

  /** Shorthand for children.length */
  get length() { return this.children.length; }

  /**
   * Shorthand for `children[0].dataType`. If there are no children, the
   * returned value is undefined.
   */
  get childType() { return this.children[0]?.dataType; }

  constructor(children: T[], owner?: CacheableModel) {
    super(SimDataType.Vector, owner);
    this.children = children;
  }

  //#region Overriden Methods

  clone(options: CellCloneOptions = {}): VectorCell<T> {
    //@ts-expect-error Cells are guaranteed to be of type T
    return new VectorCell<T>(this.children.map(child => child.clone(options)));
  }

  encode(encoder: BinaryEncoder, options?: CellEncodingOptions): void {
    encoder.int32(this._getOffsetEncodingOption(options)); // FIXME: int32 or uint32?
    encoder.uint32(this.children.length);
  }

  toXmlNode(options: CellToXmlOptions = {}): XmlElementNode {
    return new XmlElementNode({
      tag: "L",
      attributes: this._xmlAttributes(options),
      children: this.children.map(child => {
        return child.toXmlNode({ typeAttr: true })
      })
    });
  }

  validate({ ignoreCache = false } = {}): void {
    if (this.children.length > 0) {
      this.children.forEach(child => {
        if (child.dataType !== this.childType) {
          throw new Error(`Not all vector children have the same type: ${this.childType} ≠ ${child.dataType}`);
        }

        if (!ignoreCache && child.owner !== this) {
          throw new Error("Cache Problem: Child cell has another owner.");
        }
  
        child.validate({ ignoreCache });
      });
    }
  }

  //#endregion Overriden Methods

  //#region Public Methods

  /**
   * Child cells to add. Make sure that the cells being added do not already
   * belong to another model, or else their cache ownership will be broken.
   * If adding cells that belong to another model, use `addChildClones()`.
   * 
   * @param children Children to add to this cell
   */
  addChildren(...children: T[]) {
    children.forEach(child => {
      child.owner = this;
      this.children.push(child);
    });

    this.uncache();
  }

  /**
   * Child cells to add. Each cell will be cloned before it is added,
   * ensuring that the cache ownership of the original children is kept intact.
   * 
   * @param children Children to clone and add to this cell
   */
  addChildClones(...children: T[]) {
    //@ts-expect-error The cell clones are guaranteed to be of type T
    this.addChildren(...(values.map(cell => cell.clone())));
  }

  /**
   * Child cells to remove. All cells are objects, and they are removed by
   * reference equality. You must pass in the exact objects you want to remove.
   * 
   * @param children Children to remove from this cell
   */
  removeChildren(...children: T[]) {
    if(removeFromArray(children, this.children)) this.uncache();
  }
  
  /**
   * Sets the child at the given index. If the index is negative, nothing
   * happens. If the index is out of bounds, the array will be padded with
   * undefined values up to the specified index.
   * 
   * @param index Index of child to set
   * @param child Child to set
   */
  setChild(index: number, child: T) {
    if (index < 0) return;
    while (index >= this.children.length) this.children.push(undefined);
    this.children[index] = child;
    this.uncache();
  }

  //#endregion Public Methods

  //#region Static Methods

  /**
   * Parses a VectorCell from the given XML node, using the given schemas to
   * read its children if needed.
   * 
   * @param schemas Schemas that this vectors children may follow
   * @param node Node to parse as a VectorCell
   */
  static fromXmlNode(schemas: SimDataSchema[], node: XmlNode): VectorCell {
    if (node.numChildren === 0) {
      return VectorCell.getDefault();
    } else {
      const rawType = node.child.attributes.type;
      const childType = SimDataTypeUtils.parseSims4StudioName(rawType);
      if (childType === undefined)
        throw new Error(`'${rawType}' is not a valid value for the 'type' attribute.`);
      
      const children = node.children.map(childNode => {
        const { type } = childNode.attributes;
        const thisChildType = SimDataTypeUtils.parseSims4StudioName(type);
        if (thisChildType !== childType)
          throw new Error(`Vector children have mis-matched types: ${childType} ≠ ${thisChildType}`);
        return Cell.parseXmlNode(childType, schemas, childNode);
      });

      return new VectorCell(children);
    }
  }

  /**
   * Creates the default cell for this type, given a schema to follow.
   * 
   * @param schema Schema for this ObjectCell to follow
   */
  static getDefault<U extends Cell = Cell>(): VectorCell<U> {
    return new VectorCell<U>([]);
  }

  //#endregion Static Methods
}

/**
 * A cell that may contain another cell.
 */
export class VariantCell extends Cell {
  readonly dataType: SimDataType.Variant;

  constructor(public typeHash: number, public child: Cell, owner?: CacheableModel) {
    super(SimDataType.Variant, owner);
    if (child) child.owner = this;
    this._watchProps('typeHash', 'child');
  }

  clone(options: CellCloneOptions = {}): VariantCell {
    return new VariantCell(this.typeHash, this.child?.clone(options));
  }

  encode(encoder: BinaryEncoder, options?: CellEncodingOptions): void {
    encoder.int32(this._getOffsetEncodingOption(options)); // intentionally signed
    encoder.uint32(this.typeHash);
  }

  toXmlNode(options: CellToXmlOptions = {}): XmlElementNode {
    const attributes = this._xmlAttributes(options);
    attributes.variant = formatAsHexString(this.typeHash, 8, true);

    const children: XmlNode[] = [];
    if (this.child) {
      if (this.child.dataType === SimDataType.Object) {
        const objChild = this.child as ObjectCell;
        attributes.schema = objChild.schema.name;
        objChild.schema.columns.forEach(column => {
          const child = objChild.row[column.name]
          children.push(child.toXmlNode({ nameAttr: column.name }));
        });
      } else {
        children.push(this.child.toXmlNode({ typeAttr: true }));
      }
    }

    return new XmlElementNode({
      tag: "V",
      attributes,
      children
    });
  }

  validate({ ignoreCache = false } = {}): void {
    if (!ignoreCache && this.child.owner !== this) {
      throw new Error("Cache Problem: Child cell has another owner.");
    }

    this.child?.validate({ ignoreCache });
  }

  //#region Static Methods

  /**
   * Parses a VariantCell from the given XML node, using the given schemas to
   * read its child if needed.
   * 
   * @param schemas Schemas that this variant's child may follow
   * @param node Node to parse as a VariantCell
   */
  static fromXmlNode(schemas: SimDataSchema[], node: XmlNode): VariantCell {
    const typeHash = parseInt(node.attributes.variant, 16);
    if (typeHash === NaN)
      throw new Error(`Expected variant to have a numerical 'variant' attribute, but found '${node.attributes.variant}'.`);

    if (node.attributes.schema) {
      const child = ObjectCell.fromXmlNode(schemas, node);
      return new VariantCell(typeHash, child);
    } else {
      if (node.child) {
        const childType = SimDataTypeUtils.parseSims4StudioName(node.child.attributes.type);
        if (childType === undefined)
          throw new Error(`'${childType}' is not a valid value for the 'type' attribute.`);
        const child = Cell.parseXmlNode(childType, schemas, node.child);
        return new VariantCell(typeHash, child);
      } else {
        return new VariantCell(typeHash, undefined);
      }
    }
  }

  /**
   * Creates the default cell for this type, given a schema to follow.
   * 
   * @param schema Schema for this ObjectCell to follow
   */
  static getDefault(): VariantCell {
    return new VariantCell(0, undefined);
  }

  //#endregion Static Methods
}

//#endregion Cells
