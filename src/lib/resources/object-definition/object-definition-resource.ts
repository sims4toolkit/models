import clone from "just-clone";
import compare from "just-compare";
import WritableModel, { WritableModelCreationOptions, WritableModelFromOptions } from '../../base/writable-model';
import { promisify } from '../../common/helpers';
import BinaryResourceType from "../../enums/binary-resources";
import EncodingType from '../../enums/encoding-type';
import ResourceRegistry from "../../packages/resource-registry";
import Resource from '../resource';
import readObjDef from "./serialization/read-objdef";
import writeObjDef from "./serialization/write-objdef";
import { ObjectDefinitionDto, ObjectDefinitionProperties } from './types';

/**
 * Model for object definition resources.
 */
export default class ObjectDefinitionResource
  extends WritableModel implements Resource, ObjectDefinitionDto {

  static LATEST_VERSION = 2;

  readonly encodingType: EncodingType = EncodingType.OBJDEF;

  /** The version. This should be equal to LATEST_VERSION. */
  version: number;

  // FIXME: cacheing can be done, see how simdata obj does it
  /**
   * An object of properties. Note that mutating individual properties will not
   * uncache the buffer or owning model - it must be reassigned.
   */
  properties: ObjectDefinitionProperties;

  //#region Initialization

  /**
   * Creates a new ObjectDefinitionResource from the given data.
   * 
   * @param version The version (currently 2)
   * @param properties An object of properties
   * @param options Object containing optional arguments
   */
  constructor(
    version: number,
    properties: ObjectDefinitionProperties,
    options?: WritableModelCreationOptions
  ) {
    super(options);
    this.version = version;
    this.properties = properties;
    this._watchProps("version", "properties");
  }

  /**
   * Creates a new ObjectDefinitionResource from the given buffer. The buffer is
   * assumed to be uncompressed; passing in a compressed buffer can lead to
   * unexpected behavior.
   * 
   * @param buffer The decompressed buffer for this ObjectDefinitionResource
   * @param options Object containing optional arguments
   */
  static from(
    buffer: Buffer,
    options?: WritableModelFromOptions
  ): ObjectDefinitionResource {
    const dto = readObjDef(buffer, options);
    return new ObjectDefinitionResource(dto.version, dto.properties, options);
  }

  /**
   * Asynchronously creates a new ObjectDefinitionResource from the given
   * buffer. The buffer is assumed to be uncompressed; passing in a compressed
   * buffer can lead to unexpected behavior.
   * 
   * @param buffer The decompressed buffer for this ObjectDefinitionResource
   * @param options Object containing optional arguments
   */
  static async fromAsync(
    buffer: Buffer,
    options?: WritableModelCreationOptions
  ): Promise<ObjectDefinitionResource> {
    return promisify(() => ObjectDefinitionResource.from(buffer, options));
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): ObjectDefinitionResource {
    return new ObjectDefinitionResource(this.version, clone(this.properties), {
      defaultCompressionType: this.defaultCompressionType,
      initialBufferCache: this._bufferCache
    });
  }

  equals(other: any): boolean {
    if (other?.encodingType !== this.encodingType) return false;
    if (other?.version !== this.version) return false;
    return compare(this.properties, other.properties);
  }

  isXml() {
    return false;
  }

  //#endregion Public Methods

  //#region Protected Methods

  protected _serialize(): Buffer {
    return writeObjDef(this);
  }

  //#endregion Protected Methods
}

ResourceRegistry.register(
  ObjectDefinitionResource,
  type => type === BinaryResourceType.ObjectDefinition
);
