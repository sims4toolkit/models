import { CompressedBuffer, CompressionType } from "@s4tk/compression";
import { WritableModelCreationOptions, WritableModelFromOptions } from "../../base/writable-model";
import { promisify } from "../../common/helpers";
import EncodingType from "../../enums/encoding-type";
import StaticResource from "../abstracts/static-resource";

/**
 * Model for resources that have been deleted. Primarily for use with extracting
 * resources from delta packages.
 */
export default class DeletedResource extends StaticResource {
  private static readonly _EMPTY_BUFFER_CACHE: CompressedBuffer = {
    buffer: Buffer.alloc(0),
    compressionType: CompressionType.DeletedRecord,
    sizeDecompressed: 0,
  };

  readonly encodingType: EncodingType = EncodingType.Null;

  //#region Initialization

  /**
   * Creates a new DeletedResource. The only option that will be used is the
   * owner.
   * 
   * @param options Object containing optional arguments.
   */
  constructor(options?: WritableModelCreationOptions) {
    super({
      defaultCompressionType: CompressionType.DeletedRecord,
      owner: options?.owner,
      initialBufferCache: DeletedResource._EMPTY_BUFFER_CACHE
    });
  }

  /**
   * Creates a new DeletedResource, disregarding the given arguments. This only
   * exists for parity between models.
   * 
   * @param buffer A buffer
   * @param options An object
   */
  static from(buffer: Buffer, options?: WritableModelFromOptions): DeletedResource {
    return new DeletedResource(options);
  }

  /**
   * Asynchronously creates a new DeletedResource, disregarding the given
   * arguments. This only exists for parity between models.
   * 
   * @param buffer A buffer
   * @param options An object
   */
  static async fromAsync(buffer: Buffer, options?: WritableModelFromOptions): Promise<DeletedResource> {
    return promisify(() => DeletedResource.from(buffer, options));
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): DeletedResource {
    return new DeletedResource();
  }

  //#endregion Public Methods
}
