import clone from "just-clone";
import compare from "just-compare";
import { CompressedBuffer, CompressionType } from "@s4tk/compression";
import WritableModel, { WritableModelCreationOptions, WritableModelFromOptions } from '../../base/writable-model';
import { camelToPascal, pascalToCamel, promisify } from '../../common/helpers';
import BinaryResourceType from "../../enums/binary-resources";
import EncodingType from '../../enums/encoding-type';
import ResourceRegistry from "../../packages/resource-registry";
import Resource from '../resource';
import readObjDef from "./serialization/read-objdef";
import writeObjDef from "./serialization/write-objdef";
import { ObjectDefinitionDto, ObjectDefinitionProperties, ObjectDefinitionType } from './types';

/** Arguments for SimDataResource's constructor. */
export interface ObjectDefinitionResourceCreationOptions extends
  WritableModelCreationOptions,
  Partial<ObjectDefinitionDto> { };

/**
 * Model for object definition resources.
 */
export default class ObjectDefinitionResource
  extends WritableModel implements Resource, ObjectDefinitionDto {

  static LATEST_VERSION = 2;

  readonly encodingType: EncodingType = EncodingType.OBJDEF;

  /** The version. This should be equal to LATEST_VERSION. */
  version: number;

  /**
   * An object of properties. Note that mutating this object or individual
   * properties on it will not uncache this model or its owner. To handle
   * cacheing, there are multiple options:
   * 
   * ```ts
   * // using setProperty()
   * def.setProperty(ObjectDefinitionType.IsBaby, true);
   * 
   * // using updateProperties()
   * def.updateProperties(props => {
   *   props.isBaby = true;
   * });
   * 
   * // using onChange()
   * def.properties.isBaby = true;
   * def.onChange();
   *
   * // using reassignment
   * def.properties.isBaby = true;
   * def.properties = def.properties;
   * ```
   */
  properties: ObjectDefinitionProperties;

  //#region Initialization

  /**
   * Creates a new ObjectDefinitionResource from the given data.
   * 
   * @param options Object containing arguments
   */
  constructor(
    options?: ObjectDefinitionResourceCreationOptions
  ) {
    super(options);
    this.version = options?.version ?? ObjectDefinitionResource.LATEST_VERSION;
    this.properties = options?.properties ?? {};
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
    let initialBufferCache: CompressedBuffer;

    if (options?.saveBuffer) initialBufferCache = options?.initialBufferCache ?? {
      buffer,
      compressionType: CompressionType.Uncompressed,
      sizeDecompressed: buffer.byteLength
    };

    return new ObjectDefinitionResource({
      version: dto.version,
      properties: dto.properties,
      defaultCompressionType: options?.defaultCompressionType,
      owner: options?.owner,
      initialBufferCache
    });
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

  //#region Overridden Methods

  clone(): ObjectDefinitionResource {
    return new ObjectDefinitionResource({
      version: this.version,
      properties: clone(this.properties),
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

  //#endregion Overridden Methods

  //#region Public Methods

  /**
   * Dynamically gets a value from the properties object. This is here for
   * convenience, but it is recommended to access properties directly since it
   * will be more type-safe.
   * 
   * @param type Type of property to get value for
   */
  getProperty(type: ObjectDefinitionType): unknown {
    const enumName = ObjectDefinitionType[type];
    const propKey = pascalToCamel(enumName);
    return this.properties[propKey];
  }

  /**
   * Dynamically sets a value in the properties object. This is here for
   * convenience, but it is recommended to set properties with
   * `updateProperties()` since it will be more type-safe.
   * 
   * @param type Type of property to set value of
   * @param value Value to set
   */
  setProperty(type: ObjectDefinitionType, value: any) {
    const enumName = ObjectDefinitionType[type];
    const propKey = pascalToCamel(enumName);
    this.properties[propKey] = value;
    this.onChange();
  }

  /**
   * Provides a context in which properties can be updated in a way that is
   * safe for cacheing. The provided function will be executed, and when it is
   * done, the model and its owner will be uncached.
   * 
   * @param fn Function to perform property updates in
   */
  updateProperties(fn: (props: ObjectDefinitionProperties) => void) {
    fn(this.properties);
    this.onChange();
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
