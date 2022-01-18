import type SimDataResource from "./simDataResource";
import type { ObjectCellRow, CellCloneOptions } from "./shared";
import { XmlElementNode, XmlNode } from "@s4tk/xml-dom";
import { formatAsHexString } from "@s4tk/hashing/formatting";
import { ObjectCell } from "./simDataCells";
import CacheableModel from "../../abstract/cacheableModel";
import { SimDataType, SimDataTypeUtils } from "./simDataTypes";
import { arraysAreEqual, removeFromArray } from "../../helpers";

/**
 * A schema that objects in a SimData can follow.
 */
export class SimDataSchema extends CacheableModel {
  private _columns: SimDataSchemaColumn[];

  /**
   * An array that contains the columns for this schema. Mutating this array and
   * its children is safe in terms of cacheing.
   */
  get columns() { return this._columns; }
  private set columns(columns: SimDataSchemaColumn[]) {
    const owner = this._getCollectionOwner();
    columns.forEach(column => column.owner = owner);
    this._columns = this._getCollectionProxy(columns);
  }

  constructor(public name: string, public hash: number, columns: SimDataSchemaColumn[], owner?: CacheableModel) {
    super(owner);
    this.columns = columns ?? [];
    this._watchProps('name', 'hash');
  }

  protected _getCollectionOwner(): CacheableModel {
    return this.owner;
  }

  /**
   * Clones and adds the given columns to this schema. It is always recommended
   * to use this method over a regular `push()` when sharing columns between
   * schemas, so as to avoid cacheing issues.
   * 
   * @param columns Columns to add to this schema
   */
  addColumnClones(...columns: SimDataSchemaColumn[]) {
    this.columns.push(...(columns.map(column => column.clone())));
  }

  /**
   * Creates a deep copy of this schema, with all of its contents (except for
   * its owner) being copied.
   */
  clone(): SimDataSchema {
    return new SimDataSchema(this.name, this.hash, this.columns.map(column => column.clone()));
  }

  /**
   * Checks whether this schema contains the same values as the other.
   * 
   * @param other Other schema to check for equality
   */
  equals(other: SimDataSchema): boolean {
    if (!other) return false;
    if (this.name !== other.name) return false;
    if (this.hash !== other.hash) return false;
    return arraysAreEqual(this.columns, other.columns);
  }

  /**
   * Removes the given columns from this schema. Columns are removed by
   * reference equality, so the given objects must be the exact objects that
   * exist in this SimData.
   * 
   * @param columns Columns to remove to this schema
   */
  removeColumns(...columns: SimDataSchemaColumn[]) {
    removeFromArray(columns, this.columns);
  }

  /**
   * Creates an XmlElementNode object that represents this schema as it would
   * appear within an S4S-style XML SimData document.
   */
  toXmlNode(): XmlElementNode {
    return new XmlElementNode({
      tag: "Schema",
      attributes: {
        name: this.name,
        schema_hash: formatAsHexString(this.hash, 8, true)
      },
      children: [
        new XmlElementNode({
          tag: "Columns",
          children: this.columns.map(c => c.toXmlNode())
        })
      ]
    });
  }

  protected _onOwnerChange(previousOwner: CacheableModel): void {
    this.columns.forEach(column => column.owner = this._getCollectionOwner());
    super._onOwnerChange(previousOwner);
  }

  /**
   * Parses an S4S-style XML node as a schema.
   * 
   * @param node Node to parse as a schema
   */
  static fromXmlNode(node: XmlNode): SimDataSchema {
    if (node.tag !== "Schema")
      throw new Error(`Expected a <Schema>, got a <${node.tag}>`);
    if (!node.attributes.name)
      throw new Error(`Expected <Schema> to have a 'name' attribute.`);
    if (!node.attributes.schema_hash)
      throw new Error(`Expected <Schema> to have a 'schema_hash' attribute.`);
    const schemaHash = parseNodeAttrAsNumber(node, 'schema_hash');
    const columnsNode = node.child;
    if (columnsNode.tag !== "Columns")
      throw new Error(`Expected <Schema> to contain a child node called <Columns>`);
    return new SimDataSchema(
      node.attributes.name,
      schemaHash,
      columnsNode.children.map(node => SimDataSchemaColumn.fromXmlNode(node))
    );
  }
}

/**
 * A column in a SimData schema.
 */
export class SimDataSchemaColumn extends CacheableModel {
  constructor(public name: string, public type: SimDataType, public flags: number, owner?: CacheableModel) {
    super(owner);
    this._watchProps('name', 'type', 'flags');
  }

  /**
   * Creates a deep copy of this column, with all values except for owner being
   * copied over.
   */
  clone(): SimDataSchemaColumn {
    return new SimDataSchemaColumn(this.name, this.type, this.flags);
  }

  /**
   * Checks whether this column contains the same values as the other.
   * 
   * @param other Other column to check for equality
   */
  equals(other: SimDataSchemaColumn): boolean {
    if (!other) return false;
    if (this.name !== other.name) return false;
    if (this.type !== other.type) return false;
    if (this.flags !== other.flags) return false;
    return true;
  }

  /**
   * Creates an XmlElementNode object that represents this column as it would
   * appear within an S4S-style XML SimData document.
   */
  toXmlNode(): XmlElementNode {
    return new XmlElementNode({
      tag: "Column",
      attributes: {
        name: this.name,
        type: SimDataTypeUtils.getSims4StudioName(this.type),
        flags: formatAsHexString(this.flags, 8, true)
      }
    });
  }

  /**
   * Parses an S4S-style XML node as a column.
   * 
   * @param node Node to parse as a column
   */
  static fromXmlNode(node: XmlNode): SimDataSchemaColumn {
    if (node.tag !== "Column")
      throw new Error(`Expected a <Column>, got a <${node.tag}>`);
    if (!node.attributes.name)
      throw new Error(`Expected <Column> to have a 'name' attribute.`);
    if (!node.attributes.type)
      throw new Error(`Expected <Column> to have a 'type' attribute.`);
    const type = SimDataTypeUtils.parseSims4StudioName(node.attributes.type);
    if (!node.attributes.flags)
      throw new Error(`Expected <Column> to have a 'flags' attribute.`);
    const flags = parseNodeAttrAsNumber(node, 'flags');
    return new SimDataSchemaColumn(node.attributes.name, type, flags);
  }
}

/**
 * A top-level object cell with a name. These are the only cells that appear in
 * a SimData XML, so these are the models that users are familiar with.
 */
export class SimDataInstance extends ObjectCell {
  constructor(public name: string, schema: SimDataSchema, row: ObjectCellRow, owner?: CacheableModel) {
    super(schema, row, owner);
    this._watchProps('name');
  }

  clone(options?: CellCloneOptions): SimDataInstance {
    const { schema, row } = this._internalClone(options);
    return new SimDataInstance(this.name, schema, row);
  }

  equals(other: SimDataInstance): boolean {
    if (!super.equals(other)) return false;
    return this.name === other.name;
  }

  /**
   * Creates an XmlElementNode object that represents this instance as it would
   * appear within an S4S-style XML SimData document.
   */
  toXmlNode(): XmlElementNode {
    return new XmlElementNode({
      tag: "I",
      attributes: {
        name: this.name,
        schema: this.schema.name,
        type: SimDataTypeUtils.getSims4StudioName(this.dataType)
      },
      children: this.schema.columns.map(column => {
        return this.row[column.name].toXmlNode({ nameAttr: column.name });
      })
    });
  }

  /**
   * Creates a SimDataInstance from an ObjectCell. Nothing is cloned - exact
   * references are maintained. Additionally, the owner is not copied.
   * 
   * @param source ObjectCell to base this instance off of
   */
  static fromObjectCell(name: string, source: ObjectCell): SimDataInstance {
    return new SimDataInstance(name, source.schema, source.row, source.owner as SimDataResource);
  }

  /**
   * Parses an S4S-style XML node as an instance.
   * 
   * @param node Node to parse as a instance
   */
  static fromXmlNode(node: XmlNode, schemas: SimDataSchema[]): SimDataInstance {
    if (node.tag !== "I")
      throw new Error(`Expected a <I>, got a <${node.tag}>`);
    if (!node.attributes.name)
      throw new Error(`Expected <I> to have a 'name' attribute.`);
    const { name } = node.attributes;
    const { schema, row } = this._parseXmlNode(node, schemas);
    return new SimDataInstance(name, schema, row);
  }
}

//#region Helpers

/**
 * Parses and returns the numerical value of the given attribute on the given
 * node, if it exists and is valid. If the value cannot be parsed as a number,
 * an exception is thrown.
 * 
 * @param node Node to get attribute of
 * @param attr Name of attribute to get value of
 */
function parseNodeAttrAsNumber(node: XmlNode, attr: string): number {
  const raw = node.attributes[attr];
  const value = parseInt(raw, 16);
  if (Number.isNaN(value))
    throw new Error(`Expected value of '${attr}' to be a hex number, got ${raw}`);
  return value;
}

//#endregion Helpers
