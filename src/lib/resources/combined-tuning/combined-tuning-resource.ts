import WritableModel, { WritableModelFromOptions } from "../../base/writable-model";
import { promisify } from "../../common/helpers";
import BinaryResourceType from "../../enums/binary-resources";
import EncodingType from "../../enums/encoding-type";
import ResourceRegistry from "../../packages/resource-registry";
import Resource from "../resource";

/**
 * TODO:
 */
export default class CombinedTuningResource extends WritableModel implements Resource {
  readonly encodingType: EncodingType = EncodingType.DATA;

  //#region Properties

  // TODO:

  //#endregion Properties

  //#region Initialization

  // TODO: constructor

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
    throw new Error("Cloning combined tuning is not currently supported.");
  }

  equals(other: any): boolean {
    throw new Error("Comparing combined tuning is not currently supported.");
  }

  isXml(): boolean {
    return false;
  }

  //#endregion Public Methods

  //#region Protected Methods

  protected _serialize(): Buffer {
    throw new Error("Serializing combined tuning is not currently supported.");
  }

  //#endregion Protected Methods
}

ResourceRegistry.register(
  CombinedTuningResource,
  type => type === BinaryResourceType.CombinedTuning
);
