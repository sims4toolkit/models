import Resource from "../resource";
import { removeFromArray } from "../../../utils/helpers";
import { SimDataInstance, SimDataSchema } from "./simDataFragments";
import { XmlDocumentNode, XmlElementNode } from "../../xml/dom";
import { formatAsHexString } from "../../../utils/formatting";
import { SimDataDto, SUPPORTED_VERSION } from "./shared";
import readData from "./serialization/readData";
import writeData from "./serialization/writeData";

/**
 * A resource for SimData (binary tuning). SimDatas are essentially mini
 * relational databases, but to simplify working with them (and for consistency
 * with Sims 4 Studio), this model uses the concept of "instances". An
 * "instance" is an object cell that has a name.
 */
export default class SimDataResource extends Resource implements SimDataDto {
  readonly variant = 'DATA';
  private _schemas: SimDataSchema[];
  private _instances: SimDataInstance[];

  /**
   * The schemas in this SimData. Individual schemas can be mutated and cacheing
   * will be handled (e.g. `schemas[0].name = "Schema"` is perfectly safe),
   * however, mutating the array itself by adding or removing schemas should be
   * avoided whenever possible, because doing so is a surefire way to mess up
   * the cache. 
   * 
   * To add schemas, use the `addSchemas()` or `addSchemaClones()` methods. To
   * remove schemas, use the `removeSchemas()` method or call `delete()` on
   * individual schemas.
   * 
   * If you insist on removing from or editing the array manually, you can, as
   * long as you remember to call `uncache()` when you are done. If you insist
   * on adding schemas manually, it's your funeral.
   */
  get schemas() { return this._schemas; }
  
  /**
   * The instances in this SimData. Instances are not "real" parts of a SimData,
   * but this model uses them as a convenient way to avoid working with data
   * tables directly.
   * 
   * Individual instances can be mutated and cacheing will be handled (e.g. 
   * `instances[0].name = "Instance"` is perfectly safe), however, mutating the
   * array itself by adding or removing instances should be avoided whenever
   * possible, because doing so is a surefire way to mess up the cache. 
   * 
   * To add instances, use the `addInstances()` or `addInstanceClones()`
   * methods. To remove instances, use the `removeInstances()` method or call
   * `delete()` on individual instances.
   * 
   * If you insist on removing from or editing the array manually, you can, as
   * long as you remember to call `uncache()` when you are done. If you insist
   * on adding instances manually, it's your funeral.
   */
  get instances() { return this._instances; }

  /** Shorthand for `instances[0]` */
  get instance() { return this.instances[0]; }

  /** Shorthand for `instances[0].row` */
  get props() { return this.instance.row; }

  /** Shorthand for `schemas[0]` */
  get schema() { return this.schemas[0]; }

  protected constructor(
    public version: number,
    public unused: number,
    schemas: SimDataSchema[],
    instances: SimDataInstance[],
    buffer?: Buffer
  ) {
    super({ buffer });
    this._schemas = schemas;
    schemas.forEach(schema => schema.owner = this);
    this._instances = instances; 
    instances.forEach(instance => instance.owner = this);
    this._watchProps('version', 'unused');
  }

  clone(): SimDataResource {
    const newSchemas = this.schemas.map(s => s.clone());
    const instances = this.instances.map(i => i.clone({ newSchemas }));
    return new SimDataResource(this.version, this.unused, newSchemas, instances);
  }

  /**
   * Creates a new SimDataResource with the given optional parameters.
   * 
   * Arguments
   * - `version`: The version of the SimData. This should be 0x101; it can be
   * left out and it will be 0x101 by default.
   * - `unused`: The "unused" UInt32 in the SimData header. This number should
   * correspond to the group number of the pack associated with this SimData,
   * or be 0 if it does not require a pack. Default is 0.
   * - `schemas`: A list of the schemas in this SimData. Default is empty.
   * - `instances`: A list of the instances in this SimData. Default is empty.
   * 
   * @param arguments Arguments for creating this SimData
   */
  static create({
    version = SUPPORTED_VERSION,
    unused = 0,
    schemas = [],
    instances = []
  }: SimDataDto): SimDataResource {
    return new SimDataResource(version, unused, schemas, instances);
  }

  /**
   * Creats a new SimDataResource from a buffer containing a binary DATA file.
   * 
   * @param buffer Buffer to read
   */
  static from(buffer: Buffer): SimDataResource {
    const { version, unused, schemas, instances } = readData(buffer);
    return new SimDataResource(version, unused, schemas, instances, buffer);
  }

  /**
   * Creats a SimDataResource from S4S-style XML.
   * 
   * @param xml XML string or buffer to parse as a SimData
   * @throws If the given XML could not be parsed as a SimData
   */
  static fromXml(xml: string | Buffer): SimDataResource {
    const dom = XmlDocumentNode.from(xml).child;

    if (!dom || dom.tag !== "SimData")
      throw new Error(`Expected <SimData>, but got <${dom.tag}>`);

    const version = parseInt(dom.attributes.version, 16);
    if (version !== SUPPORTED_VERSION)
      throw new Error(`Expected version to be ${SUPPORTED_VERSION}, got ${version}`);
    
    const unused = parseInt(dom.attributes.u, 16);
    if (Number.isNaN(unused))
      throw new Error(`Expected unused to be a number, got ${dom.attributes.u}`);

    const schemasNode = dom.children.find(node => node.tag === "Schemas");
    const schemas = schemasNode.children.map(schemaNode => {
      return SimDataSchema.fromXmlNode(schemaNode);
    });

    const instancesNode = dom.children.find(node => node.tag === "Instances");
    const instances = instancesNode.children.map(instanceNode => {
      return SimDataInstance.fromXmlNode(schemas, instanceNode);
    });

    return new SimDataResource(version, unused, schemas, instances);
  }

  /**
   * Adds schemas to this SimData and uncaches the buffer.
   * 
   * @param schemas Schemas to add
   */
  addSchemas(...schemas: SimDataSchema[]) {
    this.schemas.push(...schemas);
    schemas.forEach(schema => schema.owner = this);
    this.uncache();
  }

  /**
   * Removes schemas from this SimData and uncaches the buffer. Note that
   * schemas are removed by reference equality, so the passed in schemas must be
   * the exact objects you want to remove. Alternatively, you can call
   * `delete()` on the schemas themselves to remove them one by one.
   * 
   * @param schemas Schemas to remove
   */
  removeSchemas(...schemas: SimDataSchema[]) {
    if (removeFromArray(schemas, this.schemas)) this.uncache();
  }

  /**
   * Adds instances to this SimData and uncaches the buffer.
   * 
   * @param instances Instances to add
   */
  addInstances(...instances: SimDataInstance[]) {
    this.instances.push(...instances);
    instances.forEach(instance => instance.owner = this);
    this.uncache();
  }

  /**
   * Removes instances from this SimData and uncaches the buffer. Note that
   * instances are removed by reference equality, so the passed in instances
   * must be the exact objects you want to remove. Alternatively, you can call
   * `delete()` on the instances themselves to remove them one by one.
   * 
   * @param instances Instances to remove
   */
  removeInstances(...instances: SimDataInstance[]) {
    if (removeFromArray(instances, this.instances)) this.uncache();
  }

  /**
   * Creates an XmlDocumentNode object that represents this SimData exactly as
   * it would appear in Sims 4 Studio.
   */
  toXmlDocument(): XmlDocumentNode {
    return new XmlDocumentNode(new XmlElementNode({
      tag: 'SimData',
      attributes: {
        version: formatAsHexString(this.version, 8, true),
        u: formatAsHexString(this.unused, 8, true)
      },
      children: [
        new XmlElementNode({
          tag: 'Instances',
          children: this.instances.map(i => i.toXmlNode())
        }),
        new XmlElementNode({
          tag: 'Schemas',
          children: this.schemas.map(s => s.toXmlNode())
        })
      ]
    }));
  }

  protected _serialize(): Buffer {
    return writeData(this);
  }
}
