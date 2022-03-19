import { compressBuffer, CompressionType } from "@s4tk/compression";
import ApiModelBase from "./api-model";
import { promisify } from "../common/helpers";
import CompressedBufferWrapper from "./compressed-buffer";

/**
 * Optional arguments for writable models.
 */
type WritableModelConstructorArguments = Partial<{
  /**
   * How this model's buffer should be compressed by default. If not supplied,
   * ZLIB compression is assumed.
   */
  defaultCompressionType: CompressionType;

  /**
   * The initial cache to use for this model's buffer. This will not be cleared
   * until a change is detected.
   */
  initialBufferCache: CompressedBufferWrapper;

  /**
   * The model that contains this one. The owner is notified whenever the child
   * model is changed.
   */
  owner: ApiModelBase;
}>;

/**
 * Base class for models that can be written to disk.
 */
export default abstract class WritableModel extends ApiModelBase {
  //#region Properties

  private _bufferCache?: CompressedBufferWrapper;
  private _defaultCompressionType: CompressionType;

  /**
   * How this model's buffer should be compressed by default. This is not
   * necessarily the same as the compression type of the current buffer cache.
   */
  get defaultCompressionType(): CompressionType { return this._defaultCompressionType; }
  set defaultCompressionType(value: CompressionType) {
    if (this._defaultCompressionType !== value) this._clearBufferCacheIfSupported();
    this._defaultCompressionType = value ?? CompressionType.Uncompressed;
  }

  /** Whether this model currently has a cached buffer. */
  get hasBufferCache(): boolean { return this._bufferCache != undefined; }

  //#endregion Properties

  //#region Initialization

  protected constructor(args: WritableModelConstructorArguments) {
    super(args.owner);
    this._defaultCompressionType = args.defaultCompressionType ?? CompressionType.ZLIB;
    if (args.initialBufferCache) this._bufferCache = args.initialBufferCache;
  }

  //#endregion Initialization

  //#region Public Methods

  /**
   * Returns an uncompressed buffer for this model. If an uncompressed buffer is
   * available in the cache, it will be returned.
   * 
   * @param cache Whether or not the buffer that is returned by this method
   * should be cached. If the buffer is already cached, it will not be deleted
   * if this argument is false. False by default.
   */
  getBuffer(cache: boolean = false): Buffer {
    if (this._bufferCache?.compressionType === CompressionType.Uncompressed) {
      return this._bufferCache.buffer;
    }

    const buffer = this._serialize();

    if (cache) {
      this._bufferCache = {
        buffer,
        sizeDecompressed: buffer.byteLength,
        compressionType: CompressionType.Uncompressed
      };
    }

    return buffer;
  }

  /**
   * Generates an uncompressed buffer for this model asynchronously and returns
   * it in a Promise. If an uncompressed buffer is available in the cache, it
   * will be returned.
   * 
   * @param cache Whether or not the buffer that is returned by this method
   * should be cached. If the buffer is already cached, it will not be deleted
   * if this argument is false. False by default.
   */
  async getBufferAsync(cache?: boolean): Promise<Buffer> {
    return promisify(() => this.getBuffer(cache));
  }

  /**
   * Returns a wrapper for the compressed buffer for this model. If a buffer in
   * the correct compression format is available on this model, it will be
   * returned.
   * 
   * @param cache Whether or not the buffer that is returned by this method
   * should be cached. If the buffer is already cached, it will not be deleted
   * if this argument is false. False by default.
   * @param compressionType How the buffer should be compressed. If not given,
   * the default compression type for this model is used.
   */
  getCompressedBuffer(
    cache: boolean = false,
    compressionType: CompressionType = this.defaultCompressionType,
  ): CompressedBufferWrapper {
    if (this._bufferCache?.compressionType === compressionType) {
      return this._bufferCache;
    }

    const uncompressedBuffer = this._serialize();
    const wrapper: CompressedBufferWrapper = {
      buffer: compressBuffer(uncompressedBuffer, compressionType),
      sizeDecompressed: uncompressedBuffer.byteLength,
      compressionType
    };

    if (cache) this._bufferCache = wrapper;
    return wrapper;
  }

  /**
   * Generates a wrapper for the compressed buffer for this model
   * asynchronously, and returns it in a Promise. If a buffer in the correct
   * compression format is available on this model, it will be returned.
   * 
   * @param cache Whether or not the buffer that is returned by this method
   * should be cached. If the buffer is already cached, it will not be deleted
   * if this argument is false. False by default.
   * @param compressionType How the buffer should be compressed. If not given,
   * the default compression type for this model is used.
   */
  async getCompressedBufferAsync(
    cache?: boolean,
    compressionType?: CompressionType,
  ): Promise<CompressedBufferWrapper> {
    return promisify(() => this.getCompressedBuffer(cache, compressionType));
  }

  onChange() {
    this._clearBufferCacheIfSupported();
    super.onChange();
  }

  //#endregion Public Methods

  //#region Protected Methods

  /**
   * Clears this model's cache, if it is able to. Subclasses for which the cache
   * cannot be cleared must override this method and NOT call super.
   */
  protected _clearBufferCacheIfSupported() {
    delete this._bufferCache;
  }

  /**
   * Returns a newly serialized, decompressed buffer for this model.
   */
  protected abstract _serialize(): Buffer;

  //#endregion Protected Methods
}
