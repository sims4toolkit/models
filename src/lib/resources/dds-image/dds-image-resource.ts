import { CompressedBuffer, CompressionType } from '@s4tk/compression';
import { DdsImage } from "@s4tk/images";
import { WritableModelCreationOptions } from '../../base/writable-model';
import { promisify } from '../../common/helpers';
import BinaryResourceType from '../../enums/binary-resources';
import EncodingType from '../../enums/encoding-type';
import ResourceRegistry from '../../packages/resource-registry';
import StaticResource from '../abstracts/static-resource';

/**  Optional arguments for initializing DdsImageResource. */
export interface DdsImageResourceCreationOptions extends
  Omit<WritableModelCreationOptions, "initialBufferCache">,
  Partial<{
    /** The DDS image to initialize this resource with, if any. */
    initialDdsImageCache: DdsImage;
  }> { };

/**
 * Model for DDS image resources, including ones with DST compression.
 */
export default class DdsImageResource extends StaticResource {
  readonly encodingType: EncodingType = EncodingType.DDS;

  private _ddsImageCache?: DdsImage;

  /**
   * Model for the DDS image in this resource. The image should be shuffled if
   * and only if this resource's type is DST. Mutating this image object will
   * NOT update this resource - it will only be updated when you either set the
   * `image` property to a new DdsImage or use `replaceContent()`.
   */
  get image(): DdsImage {
    return this._ddsImageCache ??= DdsImage.from(this.buffer);
  }

  set image(value: DdsImage) {
    const buffer = value.buffer;

    this.replaceContent({
      buffer,
      compressionType: CompressionType.Uncompressed,
      sizeDecompressed: buffer.length
    });

    this._ddsImageCache = value;
  }

  //#region Initialization

  /**
   * Creates a new DdsImageResource from the given buffer wrapper and options.
   * 
   * @param bufferWrapper The CompressedBuffer wrapper for this resource's buffer
   * @param options Object containing optional arguments
   */
  constructor(bufferWrapper: CompressedBuffer, options?: DdsImageResourceCreationOptions) {
    super(Object.assign({ initialBufferCache: bufferWrapper }, options));
    this._ddsImageCache = options?.initialDdsImageCache;
  }

  /**
   * Creates a new DdsImageResource from the given buffer. The buffer is assumed
   * to be uncompressed; passing in a compressed buffer can lead to unexpected
   * behavior.
   * 
   * @param buffer The decompressed buffer for this DdsImageResource
   * @param options Object containing optional arguments
   */
  static from(buffer: Buffer, options?: DdsImageResourceCreationOptions): DdsImageResource {
    return new DdsImageResource({
      buffer,
      compressionType: CompressionType.Uncompressed,
      sizeDecompressed: buffer.byteLength
    }, options);
  }

  /**
   * Asynchronously creates a new DdsImageResource from the given buffer. The
   * buffer is assumed to be uncompressed; passing in a compressed buffer can
   * lead to unexpected behavior.
   * 
   * @param buffer The decompressed buffer for this DdsImageResource
   * @param options Object containing optional arguments
   */
  static async fromAsync(buffer: Buffer, options?: DdsImageResourceCreationOptions): Promise<DdsImageResource> {
    return promisify(() => DdsImageResource.from(buffer, options));
  }

  /**
   * Creates a new DdsImageResource from the given DdsImage object.
   * 
   * @param image DDS image object to create this resource from
   * @param compression If provided, then the image is guaranteed to be in the
   * given compression format
   */
  static fromDdsImage(image: DdsImage, compression?: "dxt" | "dst"): DdsImageResource {
    if (compression && ((compression === "dst") !== (image.isShuffled === true)))
      image = compression === "dst"
        ? image.toShuffled()
        : image.toUnshuffled();

    return this.from(image.buffer, {
      initialDdsImageCache: image
    });
  }

  /**
   * Asynchronously creates a new DdsImageResource from the given DdsImage
   * object.
   * 
   * @param image DDS image object to create this resource from
   * @param compression If provided, then the image is guaranteed to be in the
   * given compression format
   */
  static async fromDdsImageAsync(image: DdsImage, compression?: "dxt" | "dst"): Promise<DdsImageResource> {
    return promisify(() => DdsImageResource.fromDdsImage(image, compression));
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): DdsImageResource {
    return new DdsImageResource(this.bufferCache, {
      defaultCompressionType: this.defaultCompressionType,
      initialDdsImageCache: this._ddsImageCache
    });
  }

  isXml(): boolean {
    return false;
  }

  replaceContent(content: CompressedBuffer): void {
    super.replaceContent(content);
    delete this._ddsImageCache;
  }

  //#endregion Public Methods
}

ResourceRegistry.register(
  DdsImageResource,
  type => {
    return type === BinaryResourceType.DstImage ||
      type === BinaryResourceType.DdsImage;
  }
);
