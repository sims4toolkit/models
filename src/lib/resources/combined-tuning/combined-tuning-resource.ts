import { WritableModelCreationOptions, WritableModelFromOptions } from "../../base/writable-model";
import { promisify } from "../../common/helpers";
import BinaryResourceType from "../../enums/binary-resources";
import ResourceRegistry from "../../packages/resource-registry";
import DataResource from "../abstracts/data-resource";

/**
 * TODO:
 */
export default class CombinedTuningResource extends DataResource {
  //#region Properties

  // TODO:

  //#endregion Properties

  //#region Initialization

  /**
   * TODO:
   * 
   * @param options TODO:
   */
  constructor(options?: WritableModelCreationOptions) {
    super(options);
    // TODO:
  }

  /**
   * TODO:
   * 
   * @param buffer TODO:
   * @param options TODO:
   */
  static from(buffer: Buffer, options?: WritableModelFromOptions): CombinedTuningResource {
    // TODO:
    return;
  }

  /**
   * TODO:
   * 
   * @param buffer TODO:
   * @param options TODO:
   */
  static async fromAsync(buffer: Buffer, options?: WritableModelFromOptions): Promise<CombinedTuningResource> {
    return promisify(() => this.from(buffer, options));
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): CombinedTuningResource {
    throw new Error("Cloning CombinedTuningResource is not supported.");
  }

  equals(other: any): boolean {
    throw new Error("Comparing CombinedTuningResource is not supported.");
  }

  //#endregion Public Methods

  //#region Protected Methods

  protected _serialize(): Buffer {
    throw new Error("Serializing CombinedTuningResource is not supported.");
  }

  //#endregion Protected Methods
}

ResourceRegistry.register(
  CombinedTuningResource,
  type => type === BinaryResourceType.CombinedTuning
);
