import type { FileReadingOptions } from "../../common/options";
import { XmlDocumentNode, XmlElementNode, XmlNode } from "@s4tk/xml-dom";
import { formatAsHexString } from "@s4tk/hashing/formatting";
import Resource from "../resource";
import { arraysAreEqual, removeFromArray } from "../../common/helpers";
import { SimDataInstance, SimDataSchema } from "./fragments";
import { SimDataDto } from "./types";
import { SUPPORTED_VERSION } from "./constants";
import readData from "./serialization/read-data";
import writeData from "./serialization/write-data";
import WritableModel from "../../base/writable-model";
import EncodingType from "../../enums/encoding-type";

/**
 * A resource for SimData (binary tuning). SimDatas are essentially mini
 * relational databases, but to simplify working with them (and for consistency
 * with Sims 4 Studio), this model uses the concept of "instances". An
 * "instance" is an object cell that has a name.
 */
export default class SimDataResource extends WritableModel implements Resource, SimDataDto {
  readonly encodingType: EncodingType = EncodingType.DATA;
  private _schemas: SimDataSchema[];
  private _instances: SimDataInstance[];

  /**
   * An array that contains the instances for this SimData. Mutating this array
   * and its children is safe in terms of cacheing.
   */
  get instances() { return this._instances; }
  private set instances(instances: SimDataInstance[]) {
    const owner = this._getCollectionOwner();
    instances.forEach(inst => inst.owner = owner);
    this._instances = this._getCollectionProxy(instances);
  }

  /** Shorthand for `instances[0]` */
  get instance() { return this.instances[0]; }
  set instance(instance: SimDataInstance) { this.instances[0] = instance; }

  /** Shorthand for `instances[0].row` */
  get props() { return this.instance.row; }

  /**
   * An array that contains the schemas for this SimData. Mutating this array
   * and its children is safe in terms of cacheing.
   */
  get schemas() { return this._schemas; }
  private set schemas(schemas: SimDataSchema[]) {
    const owner = this._getCollectionOwner();
    schemas.forEach(schema => schema.owner = owner);
    this._schemas = this._getCollectionProxy(schemas);
  }

  /** Shorthand for `schemas[0]` */
  get schema() { return this.schemas[0]; }
  set schema(schema: SimDataSchema) { this.schemas[0] = schema; }

  //#region Initialization

  protected constructor(
    public version: number,
    public unused: number,
    schemas: SimDataSchema[],
    instances: SimDataInstance[],
    saveBuffer?: boolean,
    buffer?: Buffer
  ) {
    super(saveBuffer, buffer);
    this.schemas = schemas;
    this.instances = instances; 
    this._watchProps('version', 'unused');
  }

  clone(): SimDataResource {
    const newSchemas = this.schemas.map(s => s.clone());
    const instances = this.instances.map(i => i.clone({ newSchemas }));
    const buffer = this.isCached ? this.buffer : undefined;
    return new SimDataResource(
      this.version,
      this.unused,
      newSchemas,
      instances,
      this.saveBuffer,
      buffer
    );
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
    instances = [],
    saveBuffer
  }: SimDataDto = {}): SimDataResource {
    return new SimDataResource(version, unused, schemas, instances, saveBuffer);
  }

  /**
   * Creates a new SimDataResource from a buffer containing a binary DATA file.
   * 
   * @param buffer Buffer to read
   * @param options Options to configure
   */
  static from(buffer: Buffer, options?: FileReadingOptions): SimDataResource {
    const dto = readData(buffer, options);
    return new SimDataResource(
      dto.version,
      dto.unused,
      dto.schemas,
      dto.instances,
      options?.saveBuffer,
      buffer
    );
  }

  /**
   * Creates a SimDataResource from S4S-style XML.
   * 
   * @param xml XML string or buffer to parse as a SimData
   * @param options Options to configure
   * @throws If the given XML could not be parsed as a SimData
   */
  static fromXml(xml: string | Buffer, options?: FileReadingOptions): SimDataResource {
    return this.fromXmlDocument(XmlDocumentNode.from(xml, { ignoreComments: true }), options);
  }

  /**
   * Creates a SimDataResource from an S4S-style XML document.
   * 
   * @param dom XML document from which to parse SimData
   * @param options Options to configure
   * @throws If the given XML document could not be parsed as a SimData
   */
  static fromXmlDocument(doc: XmlDocumentNode, options?: FileReadingOptions): SimDataResource {
    const dom = doc.child;

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
      return SimDataInstance.fromXmlNode(instanceNode, schemas);
    });

    return new SimDataResource(version, unused, schemas, instances, options?.saveBuffer);
  }

  //#endregion Initialization

  //#region Public Methods

  equals(other: SimDataResource): boolean {
    if (!(other instanceof SimDataResource)) return false;
    if (this.version !== other.version) return false;
    if (this.unused !== other.unused) return false;
    if (!arraysAreEqual(this.schemas, other.schemas)) return false;
    if (!arraysAreEqual(this.instances, other.instances)) return false;
    return true;
  }

  /**
   * Removes schemas from this SimData by reference equality, so the passed in
   * schemas must be the exact objects to remove.
   * 
   * @param schemas Schemas to remove
   */
  removeSchemas(...schemas: SimDataSchema[]) {
    removeFromArray(schemas, this.schemas);
  }

  /**
   * Removes instances from this SimData by reference equality, so the passed in
   * instances must be the exact objects to remove.
   * 
   * @param instances Instances to remove
   */
  removeInstances(...instances: SimDataInstance[]) {
    removeFromArray(instances, this.instances);
  }

  /**
   * Creates an XmlDocumentNode object that represents this SimData exactly as
   * it would appear in Sims 4 Studio.
   */
  toXmlDocument({ sort = false }: { sort?: boolean; } = {}): XmlDocumentNode {
    const instNode = new XmlElementNode({
      tag: 'Instances',
      children: this.instances.map(i => i.toXmlNode())
    });

    const schemasNode = new XmlElementNode({
      tag: 'Schemas',
      children: this.schemas.map(s => s.toXmlNode())
    });

    if (sort) {
      const sortAlgo = (a: XmlNode, b: XmlNode) => {
        const aName = a.attributes.name;
        const bName = b.attributes.name;
        if (aName) {
          if (bName) {
            if (aName < bName) return -1;
            if (aName > bName) return 1;
            return 0;
          }
          return -1;
        }
        return bName ? 1 : 0;
      };

      instNode.deepSort(sortAlgo);

      schemasNode.children.forEach(schemaNode => {
        if (!schemaNode.child) return;
        schemaNode.child.sort(sortAlgo);
      });
    }

    const doc = new XmlDocumentNode(new XmlElementNode({
      tag: 'SimData',
      attributes: {
        version: formatAsHexString(this.version, 8, true),
        u: formatAsHexString(this.unused, 8, true)
      },
      children: [
        instNode,
        schemasNode
      ]
    }));

    return doc;
  }

  isXml(): boolean {
    return false;
  }

  //#endregion Public Methods

  //#region Protected Methods

  protected _serialize(): Buffer {
    return writeData(this);
  }

  //#endregion Protected Methods
}
