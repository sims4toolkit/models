import type { BinaryDecoder, BinaryEncoder } from "@s4tk/encoding";
import type { SimDataSchema } from "./fragments";
import { XmlElementNode, XmlNode, XmlValueNode } from "@s4tk/xml-dom";
import DataType from "../../enums/data-type";
import type { SimDataNumber, SimDataBigInt, SimDataText, SimDataFloatVector } from "../../enums/data-type";
import { formatAsHexString } from "@s4tk/hashing/formatting";
import { fnv32 } from "@s4tk/hashing";
import { CellCloneOptions, CellEncodingOptions, CellToXmlOptions, ObjectCellRow } from "./types";
import ApiModelBase from "../../base/api-model";
import { arraysAreEqual, removeFromArray } from "../../common/helpers";

type PrimitiveType = boolean | number | bigint | string;

//#region Abstract Cells

/**
 * A value that appears in a SimData table.
 */
export abstract class Cell extends ApiModelBase {
  /**
   * Returns this cell casted as an `any`, to make accessing properties from an
   * object row less tedious if using TypeScript. This is of no use to those
   * using JavaScript.
   */
  get asAny(): any { return this; }

  constructor(public readonly dataType: DataType, owner?: ApiModelBase) {
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
   * Checks whether this cell contains the same values as the other.
   * 
   * @param other Other cell to check for equality
   */
  equals(other: Cell): boolean {
    return other && this.dataType === other.dataType;
  }

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
      attributes.type = DataType.getSims4StudioName(this.dataType);
    return attributes;
  }

  //#endregion Protected Methods

  //#region Static Methods

  /*
    NOTE: These static methods should be included here, but TS does not support
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
   * @param node Node to parse as a cell
   * @param schemas Schemas that this cell or its children may follow
   */
  static parseXmlNode(dataType: DataType, node: XmlNode, schemas: SimDataSchema[]): Cell {
    switch (dataType) {
      case DataType.Boolean:
        return BooleanCell.fromXmlNode(node);
      case DataType.Int8:
      case DataType.UInt8:
      case DataType.Int16:
      case DataType.UInt16:
      case DataType.Int32:
      case DataType.UInt32:
      case DataType.LocalizationKey:
      case DataType.Float:
        return NumberCell.fromXmlNode(dataType, node);
      case DataType.Int64:
      case DataType.UInt64:
      case DataType.TableSetReference:
        return BigIntCell.fromXmlNode(dataType, node);
      case DataType.Character:
      case DataType.String:
      case DataType.HashedString:
        return TextCell.fromXmlNode(dataType, node);
      case DataType.Float2:
        return Float2Cell.fromXmlNode(node);
      case DataType.Float3:
        return Float3Cell.fromXmlNode(node);
      case DataType.Float4:
        return Float4Cell.fromXmlNode(node);
      case DataType.ResourceKey:
        return ResourceKeyCell.fromXmlNode(node);
      case DataType.Object:
        return ObjectCell.fromXmlNode(node, schemas);
      case DataType.Vector:
        return VectorCell.fromXmlNode(node, schemas);
      case DataType.Variant:
        return VariantCell.fromXmlNode(node, schemas);
      case DataType.Undefined:
      default:
        throw new Error(`Cannot parse a "${dataType}" node as a cell.`);
    }

  }

  /**
   * Creates the appropriate cell for the given type and data.
   * 
   * @param dataType DataType of cell to create
   * @param data Data to use in cell's constructor
   */
  static create(dataType: DataType, ...data: any[]): Cell {
    switch (dataType) {
      case DataType.Boolean:
        return new BooleanCell(data[0]);
      case DataType.Character:
      case DataType.String:
      case DataType.HashedString:
        return new TextCell(dataType, data[0]);
      case DataType.Int8:
      case DataType.UInt8:
      case DataType.Int16:
      case DataType.UInt16:
      case DataType.Int32:
      case DataType.UInt32:
      case DataType.LocalizationKey:
      case DataType.Float:
        return new NumberCell(dataType, data[0]);
      case DataType.Int64:
      case DataType.UInt64:
      case DataType.TableSetReference:
        return new BigIntCell(dataType, data[0]);
      case DataType.Float2:
        return new Float2Cell(data[0], data[1]);
      case DataType.Float3:
        return new Float3Cell(data[0], data[1], data[2]);
      case DataType.Float4:
        return new Float4Cell(data[0], data[1], data[2], data[3]);
      case DataType.ResourceKey:
        return new ResourceKeyCell(data[0], data[1], data[2]);
      case DataType.Object:
        return new ObjectCell(data[0], data[1]);
      case DataType.Vector:
        return new VectorCell(data[0]);
      case DataType.Variant:
        return new VariantCell(data[0], data[1]);
      default:
        throw new Error(`DataType "${dataType}" is not recognized.`);
    }
  }

  //#endregion Static Methods
}

/**
 * A SimData cell that contains a single value. This value can either be a
 * number, bigint, string, boolean, or another cell.
 */
abstract class PrimitiveValueCell<T extends PrimitiveType> extends Cell {
  constructor(dataType: DataType, public value: T, owner?: ApiModelBase) {
    super(dataType, owner);
    this._watchProps('value');
  }

  equals(other: PrimitiveValueCell<T>): boolean {
    if (!super.equals(other)) return false;
    return this.value === other.value;
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
 * A SimData cell that contains a collection of other cells.
 */
abstract class MultiValueCell extends Cell {
  protected _getCollectionOwner(): ApiModelBase {
    return this.owner;
  }
}

/**
 * A SimData cell that contains multiple 4-byte floats.
 */
abstract class FloatVectorCell extends Cell {
  readonly dataType: SimDataFloatVector;
  protected _floatNames: string[];
  public x: number;
  public y: number;

  constructor(dataType: SimDataFloatVector, x: number, y: number, owner?: ApiModelBase) {
    super(dataType, owner);
    this.x = x ?? 0;
    this.y = y ?? 0;
    this._floatNames = ['x', 'y'];
    this._watchProps('x', 'y');
  }

  encode(encoder: BinaryEncoder, options?: CellEncodingOptions): void {
    this.validate();
    this._floatNames.forEach(floatName => encoder.float(this[floatName]));
  }

  equals(other: FloatVectorCell): boolean {
    if (!super.equals(other)) return false;
    return this._floatNames.every(floatName => {
      return this[floatName] === other?.[floatName];
    });
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
      if (!DataType.isNumberInRange(this[floatName], DataType.Float)) {
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
      if (Number.isNaN(float))
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
  readonly dataType: DataType.Boolean;

  constructor(value: boolean, owner?: ApiModelBase) {
    super(DataType.Boolean, value ?? false, owner);
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

  constructor(dataType: SimDataText, value: string, owner?: ApiModelBase) {
    super(dataType, value ?? "", owner);
  }

  clone(): TextCell {
    return new TextCell(this.dataType, this.value);
  }

  encode(encoder: BinaryEncoder, options?: CellEncodingOptions): void {
    this.validate();

    if (this.dataType === DataType.Character) {
      encoder.charsUtf8(this.value);
    } else {
      // BT uses unsigned, but I'm intentionally signing it here because it can
      // be negative and JS number don't wrap
      encoder.int32(this._getOffsetEncodingOption(options));

      if (this.dataType === DataType.HashedString) {
        encoder.uint32(fnv32(this.value));
      }
    }
  }

  validate(): void {
    if (this.dataType === DataType.Character) {
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
      if (dataType === DataType.Character) return decoder.charsUtf8(1);

      // BT uses uint32 for offset, but I'm intentionally using an int32
      // because the value CAN be negative, and JS numbers don't wrap
      const pos = decoder.tell() + decoder.int32();

      // don't need to read the hash of hashed strings, because it can/will be
      // calculated later anyways
      if (dataType === DataType.HashedString) decoder.skip(4);

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

  constructor(dataType: SimDataNumber, value: number, owner?: ApiModelBase) {
    super(dataType, value ?? 0, owner);
  }
  
  clone(): NumberCell {
    return new NumberCell(this.dataType, this.value);
  }

  encode(encoder: BinaryEncoder, options?: CellEncodingOptions): void {
    this.validate();

    switch (this.dataType) {
      case DataType.Int8:
        encoder.int8(this.value);
        break;
      case DataType.UInt8:
        encoder.uint8(this.value);
        break;
      case DataType.Int16:
        encoder.int16(this.value);
        break;
      case DataType.UInt16:
        encoder.uint16(this.value);
        break;
      case DataType.Int32:
        encoder.int32(this.value);
        break;
      case DataType.LocalizationKey:
        // fallthrough
      case DataType.UInt32:
        encoder.uint32(this.value);
        break;
      case DataType.Float:
        encoder.float(this.value);
        break;
    }
  }

  validate(): void {
    if (!DataType.isNumberInRange(this.value, this.dataType)) {
      throw new Error(`Value of ${this.value} is not within the range of ${this.dataType}.`);
    }
  }

  protected _getXmlValue(): XmlValueNode {
    if (this.dataType === DataType.LocalizationKey) {
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
        case DataType.Int8:
          return decoder.int8();
        case DataType.UInt8:
          return decoder.uint8();
        case DataType.Int16:
          return decoder.int16();
        case DataType.UInt16:
          return decoder.uint16();
        case DataType.Int32:
          return decoder.int32();
        case DataType.UInt32:
          // fallthrough
        case DataType.LocalizationKey:
          return decoder.uint32();
        case DataType.Float:
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
    const value = DataType.parseNumber(node.innerValue, dataType);
    
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

  constructor(dataType: SimDataBigInt, value: bigint, owner?: ApiModelBase) {
    super(dataType, value, owner);
  }

  clone(): BigIntCell {
    return new BigIntCell(this.dataType, this.value);
  }

  encode(encoder: BinaryEncoder, options?: CellEncodingOptions): void {
    this.validate();

    switch (this.dataType) {
      case DataType.Int64:
        encoder.int64(this.value);
        break;
      case DataType.UInt64:
        // fallthrough
      case DataType.TableSetReference:
        encoder.uint64(this.value);
        break;
    }
  }

  validate(): void {
    if (!DataType.isBigIntInRange(this.value, this.dataType)) {
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
        case DataType.Int64:
          return decoder.int64();
        case DataType.UInt64:
          // fallthrough
        case DataType.TableSetReference:
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
  readonly dataType: DataType.ResourceKey;

  constructor(public type: number, public group: number, public instance: bigint, owner?: ApiModelBase) {
    super(DataType.ResourceKey, owner);
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

  equals(other: ResourceKeyCell): boolean {
    if (!super.equals(other)) return false;
    if (this.type !== other.type) return false;
    if (this.group !== other.group) return false;
    if (this.instance !== other.instance) return false;
    return true;
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
    if (!DataType.isNumberInRange(this.type, DataType.UInt32))
      throw new Error(`ResourceKeyCell's type is not a UInt32: ${this.type}`);
    if (!DataType.isNumberInRange(this.group, DataType.UInt32))
      throw new Error(`ResourceKeyCell's group is not a UInt32: ${this.group}`);
    if (!DataType.isBigIntInRange(this.instance, DataType.TableSetReference))
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
  readonly dataType: DataType.Float2;

  constructor(x: number, y: number, owner?: ApiModelBase) {
    super(DataType.Float2, x, y, owner);
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
  readonly dataType: DataType.Float3;
  public z: number;

  constructor(x: number, y: number, z: number, owner?: ApiModelBase) {
    super(DataType.Float3, x, y, owner);
    this.z = z ?? 0;
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
  readonly dataType: DataType.Float4;
  public z: number;
  public w: number;

  constructor(x: number, y: number, z: number, w: number, owner?: ApiModelBase) {
    super(DataType.Float4, x, y, owner);
    this.z = z ?? 0;
    this.w = w ?? 0;
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
export class ObjectCell extends MultiValueCell {
  readonly dataType: DataType.Object;
  private _row: ObjectCellRow;

  /**
   * An object that maps column names to the cells that belong to those columns.
   * Mutating this object and its children is safe for cacheing purposes.
   */
  get row() { return this._row; }
  private set row(row: ObjectCellRow) {
    const owner = this._getCollectionOwner();
    for (const colName in row) if (row[colName]) row[colName].owner = owner;
    this._row = this._getCollectionProxy(row);
  }

  /** Shorthand for `Object.keys(this.row).length`. */
  get rowLength() { return Object.keys(this.row).length; }

  /** Shorthand for `this.schema.columns.length`. */
  get schemaLength() { return this.schema.columns.length; }

  constructor(public schema: SimDataSchema, row: ObjectCellRow, owner?: ApiModelBase) {
    super(DataType.Object, owner);
    this.row = row ?? {};
    this._watchProps('schema');
  }

  clone(options?: CellCloneOptions): ObjectCell {
    const { schema, row } = this._internalClone(options);
    return new ObjectCell(schema, row);
  }

  encode(encoder: BinaryEncoder, options?: CellEncodingOptions): void {
    this.validate({ ignoreCache: true });
    encoder.int32(this._getOffsetEncodingOption(options));
  }

  equals(other: ObjectCell): boolean {
    if (!super.equals(other)) return false;

    if (this.schema) {
      if (!this.schema.equals(other.schema)) return false;
    } else if (other.schema) {
      return false;
    }

    if (this.rowLength !== other.rowLength) return false;
    for (const columnName in this.row) {
      if (!this.row[columnName].equals(other.row[columnName])) return false;
    }

    return true;
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

        if (!ignoreCache && cell.owner !== this.owner)
          throw new Error("Cache Problem: Child cell has another owner.");

        cell.validate({ ignoreCache });
      });
    } else {
      throw new Error("Schema must be specified for object cell.");
    }
  }

  //#region Protected Methods

  protected _onOwnerChange(previousOwner: ApiModelBase): void {
    for (const column in this.row) this.row[column].owner = this.owner;
    super._onOwnerChange(previousOwner);
  }

  /**
   * Returns the schema and row for a clone.
   * 
   * @param options Options for cloning
   */
  protected _internalClone({ cloneSchema = false, newSchemas = [] }: CellCloneOptions = {}): {
    schema: SimDataSchema;
    row: ObjectCellRow;
  } {
    if (cloneSchema) {
      var schema = this.schema.clone();
    } else {
      var schema = newSchemas.find(schema => schema.hash === this.schema.hash) || this.schema;
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
    return new ObjectCell(schema, row);
  }

  /**
   * Parses a ObjectCell from the given XML node, using the given schemas.
   * 
   * @param schemas Schemas that this object or its children may follow
   * @param node Node to parse as a ObjectCell
   */
  static fromXmlNode(node: XmlNode, schemas: SimDataSchema[]): ObjectCell {
    const { schema, row } = ObjectCell._parseXmlNode(node, schemas);
    return new ObjectCell(schema, row);
  }

  protected static _parseXmlNode(node: XmlNode, schemas: SimDataSchema[]): { schema: SimDataSchema, row: ObjectCellRow } {
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
      const cell = Cell.parseXmlNode(column.type, child, schemas);
      row[column.name] = cell;
    });

    return { schema, row };
  }

  //#endregion Static Methods
}

/**
 * A cell that contains a list of values of the same type.
 */
export class VectorCell<T extends Cell = Cell> extends MultiValueCell {
  readonly dataType: DataType.Vector;
  private _children: T[];

  /**
   * An array that contains all of the child cells of this vector. Mutating this
   * array and its children is safe in terms of cacheing.
   */
  get children() { return this._children; }
  private set children(children: T[]) {
    const owner = this._getCollectionOwner();
    children.forEach(child => child.owner = owner);
    this._children = this._getCollectionProxy(children);
  }

  /** Shorthand for `children.length` */
  get length() { return this.children.length; }

  /**
   * Shorthand for `children[0]?.dataType`. If there are no children, the
   * returned value is undefined.
   */
  get childType() { return this.children[0]?.dataType; }

  constructor(children: T[], owner?: ApiModelBase) {
    super(DataType.Vector, owner);
    this.children = children ?? [];
  }

  //#region Overriden Methods

  clone(options: CellCloneOptions = {}): VectorCell<T> {
    //@ts-expect-error Cells are guaranteed to be of type T
    return new VectorCell<T>(this.children.map(child => child.clone(options)));
  }

  encode(encoder: BinaryEncoder, options?: CellEncodingOptions): void {
    this.validate({ ignoreCache: true });
    encoder.int32(this._getOffsetEncodingOption(options));
    encoder.uint32(this.children.length);
  }

  equals(other: VectorCell): boolean {
    if (!super.equals(other)) return false;
    return arraysAreEqual(this.children, other.children);
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

        if (!ignoreCache && child.owner !== this.owner) {
          throw new Error("Cache Problem: Child cell has another owner.");
        }
  
        child.validate({ ignoreCache });
      });
    }
  }

  protected _onOwnerChange(previousOwner: ApiModelBase): void {
    this.children.forEach(child => child.owner = this._getCollectionOwner());
    super._onOwnerChange(previousOwner);
  }

  //#endregion Overriden Methods

  //#region Public Methods

  /**
   * Pushes the given cells into this vector's children array, but clones them
   * before doing so (this should be used instead of `push()` when re-using
   * cells between vectors, or else cacheing may break). Alternatively, you may
   * use `push()` as long as you clone the cells yourself.
   * 
   * @param children Children to clone and add to this cell
   */
  addClones(...children: T[]) {
    //@ts-expect-error The cell clones are guaranteed to be of type T
    this.children.push(...(children.map(cell => cell.clone())));
  }

  /**
   * Child cells to remove. All cells are objects, and they are removed by
   * reference equality. You must pass in the exact objects you want to remove.
   * 
   * @param children Children to remove from this cell
   */
  removeChildren(...children: T[]) {
    removeFromArray(children, this.children)
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
  static fromXmlNode<U extends Cell = Cell>(node: XmlNode, schemas: SimDataSchema[] = []): VectorCell<U> {
    if (node.numChildren === 0) {
      return VectorCell.getDefault();
    } else {
      const rawType = node.child.attributes.type;
      const childType = DataType.parseSims4StudioName(rawType);
      if (childType === undefined)
        throw new Error(`'${rawType}' is not a valid value for the 'type' attribute.`);
      
      const children = node.children.map(childNode => {
        const { type } = childNode.attributes;
        const thisChildType = DataType.parseSims4StudioName(type);
        if (thisChildType !== childType)
          throw new Error(`Vector children have mis-matched types: ${childType} ≠ ${thisChildType}`);
        return Cell.parseXmlNode(childType, childNode, schemas);
      });

      // @ts-expect-error If it's made it to this point, children are guaranteed
      // to be of the same type. Not necessarily the given U, but there's no
      // way to enforce that.
      return new VectorCell<U>(children);
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
export class VariantCell<T extends Cell = Cell> extends Cell {
  readonly dataType: DataType.Variant;
  private _child?: T;

  /** The cell that this variant contains, if any. */
  get child() { return this._child; }
  set child(child: T) {
    this._child = child;
    if (child instanceof Cell) child.owner = this.owner;
  }

  /** Gets the data type of this cell's child, if it has one. */
  get childType(): DataType { return this.child?.dataType; }

  constructor(public typeHash: number, child: T, owner?: ApiModelBase) {
    super(DataType.Variant, owner);
    this.child = child;
    this._watchProps('typeHash', 'child');
  }

  clone(options: CellCloneOptions = {}): VariantCell {
    return new VariantCell(this.typeHash, this.child?.clone(options));
  }

  encode(encoder: BinaryEncoder, options?: CellEncodingOptions): void {
    this.validate({ ignoreCache: true });
    encoder.int32(this._getOffsetEncodingOption(options)); // intentionally signed
    encoder.uint32(this.typeHash);
  }

  equals(other: VariantCell): boolean {
    if (!super.equals(other)) return false;

    if (this.child) {
      if (!this.child.equals(other.child)) return false;
    } else if (other.child) {
      return false;
    }

    return this.typeHash === other.typeHash
  }

  toXmlNode(options: CellToXmlOptions = {}): XmlElementNode {
    const attributes = this._xmlAttributes(options);
    attributes.variant = formatAsHexString(this.typeHash, 8, true);

    const children: XmlNode[] = [];
    if (this.child) {
      if (this.child.dataType === DataType.Object) {
        const objChild = this.child as unknown as ObjectCell;
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
    if (!DataType.isNumberInRange(this.typeHash, DataType.UInt32))
      throw new Error(`Expected variant's type hash to be a UInt32, but got ${this.typeHash}`);

    if (this.child) {      
      if (!ignoreCache && this.child.owner !== this.owner)
        throw new Error("Cache Problem: Child cell has another owner.");
      this.child.validate({ ignoreCache });
    }
  }

  protected _onOwnerChange(previousOwner: ApiModelBase): void {
    if (this.child) this.child.owner = this.owner;
    super._onOwnerChange(previousOwner);
  }

  //#region Static Methods

  /**
   * Parses a VariantCell from the given XML node, using the given schemas to
   * read its child if needed.
   * 
   * @param schemas Schemas that this variant's child may follow
   * @param node Node to parse as a VariantCell
   */
  static fromXmlNode<U extends Cell = Cell>(node: XmlNode, schemas: SimDataSchema[] = []): VariantCell<U> {
    const typeHash = parseInt(node.attributes.variant, 16);
    if (Number.isNaN(typeHash))
      throw new Error(`Expected variant to have a numerical 'variant' attribute, but found '${node.attributes.variant}'.`);

    if (node.attributes.schema) {
      const child = ObjectCell.fromXmlNode(node, schemas);
      return new VariantCell<U>(typeHash, child as unknown as U);
    } else {
      if (node.child) {
        const childType = DataType.parseSims4StudioName(node.child.attributes.type);
        if (childType === undefined)
          throw new Error(`'${childType}' is not a valid value for the 'type' attribute.`);
        const child = Cell.parseXmlNode(childType, node.child, schemas);
        return new VariantCell<U>(typeHash, child as unknown as U);
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
