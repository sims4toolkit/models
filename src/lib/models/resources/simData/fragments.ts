import type SimDataResource from "./simDataResource";
import type { CellCloneOptions, ObjectCellRow } from "./cells";
import { ObjectCell } from "./cells";
import CacheableModel from "../../abstract/cacheableModel";
import { SimDataType, SimDataTypeUtils } from "./simDataTypes";
import { removeFromArray } from "../../../utils/helpers";
import { XmlElementNode, XmlNode } from "../../xml/dom";
import { formatAsHexString } from "../../../utils/formatting";

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
   * Creates a new SimDataSchema from the given arguments. This is a wrapper
   * for the constructor, provided for consistency with the rest of the API.
   * 
   * @param arguments Arguments for the schema to create
   */
  static create({ name, hash, columns = [] }: {
    name: string;
    hash: number;
    columns?: SimDataSchemaColumn[];
  }): SimDataSchema {
    return new SimDataSchema(name, hash, columns);
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
  owner?: SimDataSchema;

  constructor(public name: string, public type: SimDataType, public flags: number, owner?: SimDataSchema) {
    super(owner);
    this._watchProps('name', 'type', 'flags');
  }

  /**
   * Creates a new SimDataSchemaColumn from the given arguments. This is a
   * wrapper for the constructor, provided for consistency with the rest of the
   * API.
   * 
   * @param arguments Arguments for the column to create
   */
  static create({ name, type, flags = 0 }: {
    name: string;
    type: SimDataType;
    flags?: number;
  }): SimDataSchemaColumn {
    return new SimDataSchemaColumn(name, type, flags);
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
  owner?: SimDataResource;

  constructor(public name: string, schema: SimDataSchema, row: ObjectCellRow, owner?: SimDataResource) {
    super(schema, row, owner);
    this._watchProps('name');
  }

  /**
   * Creates a new SimDataInstance from the given arguments. This is a wrapper
   * for the constructor, provided for consistency with the rest of the API.
   * 
   * @param arguments Arguments for the instance to create
   */
  static create({ name, schema, row }: {
    name: string;
    schema: SimDataSchema;
    row: ObjectCellRow;
  }): SimDataInstance {
    return new SimDataInstance(name, schema, row);
  }

  /**
   * Removes this instance from its owning SimDataResource, if it has one.
   */
  delete(): void {
    this.owner?.removeInstances(this); // removeInstances() uncaches
  }

  clone(options?: CellCloneOptions): SimDataInstance {
    const { schema, row } = this._internalClone(options);
    return new SimDataInstance(this.name, schema, row);
  }

  /**
   * Creates a SimDataInstance from an ObjectCell. Nothing is cloned - exact
   * references are maintained. Additionally, the owner is not copied.
   * 
   * @param source ObjectCell to base this instance off of
   */
  static fromObjectCell(name: string, source: ObjectCell): SimDataInstance {
    // FIXME: proxy of a proxy.. is this a concern anywhere else?
    return new SimDataInstance(name, source.schema, source.row);
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
   * Parses an S4S-style XML node as an instance.
   * 
   * @param node Node to parse as a instance
   */
  static fromXmlNode(schemas: SimDataSchema[], node: XmlNode): SimDataInstance {
    if (node.tag !== "I")
      throw new Error(`Expected a <I>, got a <${node.tag}>`);
    if (!node.attributes.name)
      throw new Error(`Expected <I> to have a 'name' attribute.`);
    const { name } = node.attributes;
    const { schema, row } = this._parseXmlNode(schemas, node);
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
  if (value === NaN)
    throw new Error(`Expected value of '${attr}' to be a number, got ${raw}`);
  return value;
}

//#endregion Helpers
