import { CompressedBuffer, CompressionType } from '@s4tk/compression';
import { WritableModelCreationOptions } from '../../base/writable-model';
import { promisify } from '../../common/helpers';
import BinaryResourceType from '../../enums/binary-resources';
import EncodingType from '../../enums/encoding-type';
import ResourceRegistry from '../../packages/resource-registry';
import StaticResource from '../abstracts/static-resource';

/**  Optional arguments for initializing DstImageResource. */
export interface DstImageResourceCreationOptions extends
  Omit<WritableModelCreationOptions, "initialBufferCache"> { };

/**
 * Model for DST image resources.
 */
export default class DstImageResource extends StaticResource {
  // DDS is intentional, DST uses DDS encoding
  readonly encodingType: EncodingType = EncodingType.DDS;

  //#region Initialization

  /**
   * Creates a new DstImageResource from the given buffer wrapper and options.
   * 
   * @param bufferWrapper The CompressedBuffer wrapper for this resource's buffer.
   * @param options Object containing optional arguments.
   */
  constructor(bufferWrapper: CompressedBuffer, options?: DstImageResourceCreationOptions) {
    super(Object.assign({ initialBufferCache: bufferWrapper }, options));
  }

  /**
   * Creates a new DstImageResource from the given buffer. The buffer is assumed
   * to be uncompressed; passing in a compressed buffer can lead to unexpected
   * behavior.
   * 
   * @param buffer The decompressed buffer for this DstImageResource
   * @param options Object containing optional arguments
   */
  static from(buffer: Buffer, options?: DstImageResourceCreationOptions): DstImageResource {
    return new DstImageResource({
      buffer,
      compressionType: CompressionType.Uncompressed,
      sizeDecompressed: buffer.byteLength
    }, options);
  }

  /**
   * Asynchronously creates a new DstImageResource from the given buffer. The
   * buffer is assumed to be uncompressed; passing in a compressed buffer can
   * lead to unexpected behavior.
   * 
   * @param buffer The decompressed buffer for this DstImageResource
   * @param options Object containing optional arguments
   */
  static async fromAsync(buffer: Buffer, options?: DstImageResourceCreationOptions): Promise<DstImageResource> {
    return promisify(() => DstImageResource.from(buffer, options));
  }

  /**
   * Creates a new DstImageResource from the given PNG buffer.
   * 
   * @param buffer A buffer containing a PNG image
   * @param options Object containing optional arguments
   */
  static fromPng(buffer: Buffer, options?: DstImageResourceCreationOptions): DstImageResource {
    // TODO:
    throw new Error("DstImage.fromPng() not implemented yet.");
  }

  /**
   * Asynchronously creates a new DstImageResource from the given PNG buffer.
   * 
   * @param buffer A buffer containing a PNG image
   * @param options Object containing optional arguments
   */
  static async fromPngAsync(buffer: Buffer, options?: DstImageResourceCreationOptions): Promise<DstImageResource> {
    return promisify(() => DstImageResource.fromPng(buffer, options));
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): DstImageResource {
    return new DstImageResource(this.bufferCache, {
      defaultCompressionType: this.defaultCompressionType,
    });
  }

  /**
   * Returns a buffer containing PNG data that is equivalent to this DST image.
   */
  toPng(): Buffer {
    // TODO:
    throw new Error("DstImage.toPng() not implemented yet.");
  }

  //#endregion Public Methods
}

ResourceRegistry.register(
  DstImageResource,
  type => type === BinaryResourceType.DstImage
);
