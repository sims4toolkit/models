import { XmlDocumentNode, XmlElementNode, XmlNode } from "@s4tk/xml-dom";
import { formatAsHexString } from "@s4tk/hashing/formatting";
import type { BinaryFileReadingOptions } from "../../common/options";
import Resource from "../resource";
import { arraysAreEqual, promisify, removeFromArray } from "../../common/helpers";
import { SimDataInstance, SimDataSchema } from "./fragments";
import { SimDataDto } from "./types";
import { SUPPORTED_VERSION } from "./constants";
import readData from "./serialization/read-data";
import writeData from "./serialization/write-data";
import WritableModel, { WritableModelCreationOptions } from "../../base/writable-model";
import EncodingType from "../../enums/encoding-type";
import { CompressionType } from "@s4tk/compression";

/** Arguments for SimDataResource's constructor. */
export interface SimDataResourceCreationOptions extends
  WritableModelCreationOptions,
  SimDataDto { };

/** Arguments for SimDataResource `from()` methods. */
export interface SimDataResourceFromOptions extends
  WritableModelCreationOptions,
  BinaryFileReadingOptions { };

/**
 * Model for SimData resources. While combined tuning is the same format, it is
 * NOT supported by this model at this time.
 * 
 * SimDatas are mini relational databases, and to simplify working with them
 * (and for consistency with its XML format), this model uses the concept of
 * "instances". An "instance" is an object cell that has a name.
 */
export default class SimDataResource extends WritableModel implements Resource, SimDataDto {
  readonly encodingType: EncodingType = EncodingType.DATA;
  public version: number;
  public unused: number;
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

  /**
   * Creates a new SimData using the provided options.
   * 
   * @param options Object of options for creating the SimData
   */
  constructor(options?: SimDataResourceCreationOptions) {
    super(options);
    this.version = options?.version ?? SUPPORTED_VERSION;
    this.unused = options?.unused ?? 0;
    this.schemas = options?.schemas ?? [];
    this.instances = options?.instances ?? [];
    this._watchProps('version', 'unused');
  }

  /**
   * Creates an SimData resource from a buffer containing binary SimData data.
   * This buffer is assumed to be uncompressed; providing a compressed buffer
   * will lead to unexpected behavior.
   * 
   * @param buffer Uncompressed fuffer to create a SimData resource from
   * @param options Object of optional arguments
   */
  static from(buffer: Buffer, options?: SimDataResourceFromOptions): SimDataResource {
    const dto: SimDataResourceCreationOptions = readData(buffer, options);
    dto.defaultCompressionType = options?.defaultCompressionType;
    dto.owner = options?.owner;
    if (options?.saveBuffer) dto.initialBufferCache = options.initialBufferCache ?? {
      buffer,
      compressionType: CompressionType.Uncompressed,
      sizeDecompressed: buffer.byteLength
    };
    return new SimDataResource(dto);
  }

  /**
   * Asynchronously creates an SimData resource from a buffer containing binary
   * SimData data. This buffer is assumed to be uncompressed; providing a
   * compressed buffer will lead to unexpected behavior.
   * 
   * @param buffer Uncompressed fuffer to create a SimData resource from
   * @param options Object of optional arguments
   */
  static async fromAsync(buffer: Buffer, options?: SimDataResourceFromOptions): Promise<SimDataResource> {
    return promisify(() => SimDataResource.from(buffer, options));
  }

  /**
   * Creates a SimDataResource from S4S-style XML, as a string or Buffer. The
   * data is assumed to be uncompressed; providing a compressed string or buffer
   * will lead to unexpected behavior.
   * 
   * @param xml XML string or buffer to parse as a SimData
   * @param options Object of optional arguments
   */
  static fromXml(xml: string | Buffer, options?: SimDataResourceFromOptions): SimDataResource {
    return SimDataResource.fromXmlDocument(XmlDocumentNode.from(xml, {
      ignoreComments: true
    }), options);
  }

  /**
   * Asynchronously creates a SimDataResource from S4S-style XML, as a string or
   * Buffer. The data is assumed to be uncompressed; providing a compressed
   * string or buffer will lead to unexpected behavior.
   * 
   * @param xml XML string or buffer to parse as a SimData
   * @param options Object of optional arguments
   */
  static async fromXmlAsync(xml: string | Buffer, options?: SimDataResourceFromOptions): Promise<SimDataResource> {
    return promisify(() => SimDataResource.fromXml(xml, options));
  }

  /**
   * Creates a SimDataResource from an S4S-style XML document.
   * 
   * @param doc XML document from which to parse SimData
   * @param options Object of optional arguments
   */
  static fromXmlDocument(doc: XmlDocumentNode, options?: SimDataResourceFromOptions): SimDataResource {
    const dom = doc.child;
    const canThrow = !(options?.recoveryMode);

    if (canThrow && (!dom || dom.tag !== "SimData"))
      throw new Error(`Expected <SimData>, but got <${dom.tag}>`);

    const args: SimDataResourceCreationOptions = {};

    args.version = parseInt(dom.attributes.version, 16);
    if (canThrow && (args.version < 0x100 || args.version > SUPPORTED_VERSION))
      throw new Error(`Received unexpected version number: ${args.version}`);

    args.unused = parseInt(dom.attributes.u, 16);
    if (canThrow && Number.isNaN(args.unused))
      throw new Error(`Expected unused to be a number, got ${dom.attributes.u}`);

    const schemasNode = dom.children.find(node => node.tag === "Schemas");
    args.schemas = schemasNode.children.map(schemaNode => {
      return SimDataSchema.fromXmlNode(schemaNode);
    });

    const instancesNode = dom.children.find(node => node.tag === "Instances");
    args.instances = instancesNode.children.map(instanceNode => {
      return SimDataInstance.fromXmlNode(instanceNode, args.schemas);
    });

    return new SimDataResource(options ? Object.assign(args, options) : args);
  }

  /**
   * Asynchronously creates a SimDataResource from an S4S-style XML document.
   * 
   * @param doc XML document from which to parse SimData
   * @param options Object of optional arguments
   */
  static async fromXmlDocumentAsync(doc: XmlDocumentNode, options?: SimDataResourceFromOptions): Promise<SimDataResource> {
    return promisify(() => SimDataResource.fromXmlDocument(doc, options));
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): SimDataResource {
    const newSchemas = this.schemas.map(s => s.clone());
    const newInstances = this.instances.map(i => i.clone({ newSchemas }));
    return new SimDataResource({
      version: this.version,
      unused: this.unused,
      schemas: newSchemas,
      instances: newInstances,
      initialBufferCache: this._getBufferCache(),
      defaultCompressionType: this.defaultCompressionType,
    });
  }

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
   * it would appear in Sims 4 Studio. Note that columns are sorted by name,
   * and may not line up exactly with the order they're in in the model.
   */
  toXmlDocument(): XmlDocumentNode {
    const instNode = new XmlElementNode({
      tag: 'Instances',
      children: this.instances.map(i => i.toXmlNode())
    });

    const schemasNode = new XmlElementNode({
      tag: 'Schemas',
      children: this.schemas.map(s => s.toXmlNode())
    });

    // Technically don't have to sort these, but it helps with readability.
    // Sorting alphabetically does not guarantee the order will match schemas,
    // alphabetically is just the convention, and will work more than 97.8% of
    // the time (as of 2022/02/14). Even if it fails, the SimData can still be
    // parsed and written correctly in S4S and S4TK since the schemas have the
    // correct order.
    instNode.deepSort((a: XmlNode, b: XmlNode) => {
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
    });

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
