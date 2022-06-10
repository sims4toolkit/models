import { CompressedBuffer, CompressionType } from '@s4tk/compression';
import { WritableModelCreationOptions } from '../../base/writable-model';
import { promisify } from '../../common/helpers';
import EncodingType from '../../enums/encoding-type';
import StaticResource from '../abstracts/static-resource';

/**  Optional arguments for initializing RawResources. */
export interface RawResourceCreationOptions extends
  Omit<WritableModelCreationOptions, "initialBufferCache">,
  Partial<{
    /** Why this resource is loaded raw. Used for debugging. */
    reason: string;
  }> { };

/**
 * Model for resources that have not been parsed and have no interface to be
 * modified. To edit a RawResource, you must replace the entire buffer.
 */
export default class RawResource extends StaticResource {
  readonly encodingType: EncodingType = EncodingType.Unknown;

  /** Why this resource was loaded raw. */
  readonly reason?: string;

  //#region Initialization

  /**
   * Creates a new RawResource from the given buffer wrapper and options.
   * 
   * @param bufferWrapper The CompressedBuffer wrapper for this resource's buffer.
   * @param options Object containing optional arguments.
   */
  constructor(bufferWrapper: CompressedBuffer, options?: RawResourceCreationOptions) {
    super(Object.assign({ initialBufferCache: bufferWrapper }, options));
    this.reason = options?.reason;
  }

  /**
   * Creates a new RawResource from the given buffer. The buffer is assumed to
   * be uncompressed; passing in a compressed buffer can lead to unexpected
   * behavior.
   * 
   * @param buffer The decompressed buffer for this RawResource
   * @param options Object containing optional arguments
   */
  static from(buffer: Buffer, options?: RawResourceCreationOptions): RawResource {
    return new RawResource({
      buffer,
      compressionType: CompressionType.Uncompressed,
      sizeDecompressed: buffer.byteLength
    }, options);
  }

  /**
   * Asynchronously creates a new RawResource from the given buffer. The buffer
   * is assumed to be uncompressed; passing in a compressed buffer can lead to
   * unexpected behavior.
   * 
   * @param buffer The decompressed buffer for this RawResource
   * @param options Object containing optional arguments
   */
  static async fromAsync(buffer: Buffer, options?: RawResourceCreationOptions): Promise<RawResource> {
    return promisify(() => RawResource.from(buffer, options));
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): RawResource {
    return new RawResource(this.bufferCache, {
      defaultCompressionType: this.defaultCompressionType,
      reason: this.reason,
    });
  }

  //#endregion Public Methods
}
