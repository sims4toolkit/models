import { CompressionType, CompressedBuffer, compressBuffer, decompressBuffer } from "@s4tk/compression";
import ApiModelBase from "./api-model";
import { promisify } from "../common/helpers";

/**
 * Optional arguments for writable models' constructors.
 */
export type WritableModelConstructorArguments = Partial<{
  /**
   * How this model's buffer should be compressed by default. If not supplied,
   * no compression is assumed.
   */
  defaultCompressionType: CompressionType;

  /**
   * The initial cache to use for this model's buffer. This will not be cleared
   * until a change is detected.
   */
  initialBufferCache: CompressedBuffer;

  /**
   * The model that contains this one. The owner is notified whenever the child
   * model is changed, and will uncache its buffer.
   */
  owner: ApiModelBase;
}>;

/**
 * Base class for models that can be written to disk.
 */
export default abstract class WritableModel extends ApiModelBase {
  //#region Properties

  private _bufferCache?: CompressedBuffer;
  private _defaultCompressionType: CompressionType;

  /**
   * How this model's buffer should be compressed by default. This is not
   * necessarily the same as the compression type of the current buffer cache.
   */
  get defaultCompressionType(): CompressionType { return this._defaultCompressionType; }
  set defaultCompressionType(value: CompressionType) {
    if (this._bufferCache && (this._bufferCache.compressionType !== value)) {
      this._clearBufferCacheIfSupported();
    }

    this._defaultCompressionType = value ?? CompressionType.Uncompressed;
  }

  /** Whether this model currently has a cached buffer. */
  get hasBufferCache(): boolean {
    // intentionally != so that null is captured
    return this._bufferCache != undefined;
  }

  //#endregion Properties

  //#region Initialization

  protected constructor(args: WritableModelConstructorArguments) {
    super(args.owner);
    this._defaultCompressionType = args.defaultCompressionType ?? CompressionType.Uncompressed;
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
    if (this._bufferCache) {
      const { buffer, compressionType } = this._bufferCache;

      if (compressionType === CompressionType.Uncompressed) {
        return buffer;
      } else {
        var decompressedBuffer = decompressBuffer(buffer, compressionType);
      }
    }

    var decompressedBuffer: Buffer;
    decompressedBuffer ??= this._serialize();

    if (cache) {
      this._bufferCache = {
        buffer: decompressedBuffer,
        sizeDecompressed: decompressedBuffer.byteLength,
        compressionType: CompressionType.Uncompressed
      };
    }

    return decompressedBuffer;
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
   * the correct compression format is cached on this model, it will be
   * returned.
   * 
   * @param cache Whether or not the buffer that is returned by this method
   * should be cached. If the buffer is already cached, it will not be deleted
   * if this argument is false. False by default.
   * @param targetCompressionType How the buffer should be compressed. If not
   * given, the default compression type for this model is used.
   */
  getCompressedBuffer(
    cache: boolean = false,
    targetCompressionType: CompressionType = this.defaultCompressionType,
  ): CompressedBuffer {
    if (this._bufferCache) {
      const { buffer, compressionType } = this._bufferCache;

      if (compressionType === targetCompressionType) {
        return this._bufferCache;
      } else {
        var decompressedBuffer = decompressBuffer(buffer, compressionType);
      }
    }

    var decompressedBuffer: Buffer;
    decompressedBuffer ??= this._serialize();

    const wrapper: CompressedBuffer = {
      buffer: compressBuffer(decompressedBuffer, targetCompressionType),
      sizeDecompressed: decompressedBuffer.byteLength,
      compressionType: targetCompressionType
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
  ): Promise<CompressedBuffer> {
    return promisify(() => this.getCompressedBuffer(cache, compressionType));
  }

  onChange() {
    this._clearBufferCacheIfSupported();
    super.onChange();
  }

  //#endregion Public Methods

  //#region Protected Methods

  /**
   * Returns the current buffer cache, or undefined if there is none. This only
   * exists so that subclasses can access the cache without being able to set
   * it.
   */
  protected _getBufferCache(): CompressedBuffer {
    return this._bufferCache;
  }

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
