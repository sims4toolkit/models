import { compressBuffer, CompressionType } from '@s4tk/compression';
import ApiModelBase from './api-model';
import { promisify } from '../common/helpers';

/**
 * Base class for models that can be written to disk.
 */
export default abstract class WritableModel extends ApiModelBase {
  private _buffer?: Buffer;
  private _compressBuffer?: boolean;
  private _compressionType: CompressionType;
  private _saveBuffer: boolean;
  private _sizeDecompressed: number;

  /**
   * The buffer to use when writing this model. If a cached buffer is available,
   * it is returned. If there is no cached buffer, the model is serialized on
   * the fly (when this property is retrieved).
   */
  get buffer(): Buffer {
    if (!this.saveBuffer) return this._serializeCompressed();
    return this._buffer ??= this._serializeCompressed();
  }

  /**
   * Whether or not the buffer created by this model should be compressed. For
   * best performance, this should be true when writing resources to packages,
   * and false when writing them to disk by themselves.
   */
  get compressBuffer(): boolean { return this._compressBuffer; }
  set compressBuffer(value: boolean) {
    if (this._compressBuffer !== value) this._deleteBufferIfSupported();
    this._compressBuffer = value ?? false;
  }

  /**
   * How this model's buffer should be compressed. If `compressBuffer` is true,
   * this dictates which compression format is used when the `buffer` property
   * is accessed. If `compressBuffer` is false, this property only affects
   * resources that are being written in a package
   */
  get compressionType(): CompressionType { return this._compressionType; }
  set compressionType(value: CompressionType) {
    if (this._compressionType !== value) this._deleteBufferIfSupported();
    this._compressionType = value ?? CompressionType.Uncompressed;
  }

  /**  Whether this model currently has a cached buffer. */
  get isCached(): boolean { return this._buffer != undefined; }

  /** Alias for `compressBuffer` for readability. */
  get isCompressed(): boolean { return this.compressBuffer; }

  /** Whether or not the buffer should be cached on this model. */
  get saveBuffer() { return this._saveBuffer; }
  set saveBuffer(saveBuffer: boolean) {
    this._saveBuffer = saveBuffer ?? false;
    if (!this._saveBuffer) this._deleteBufferIfSupported();
  }

  /**
   * The size of this resource (in bytes) when it is decompressed. Unless the
   * size is already cached, this will cause the buffer to be serialized, and
   * cached if `saveBuffer == true`.
   * */
  get sizeDecompressed(): number {
    // buffer calls serialize, which caches the decompressed size
    if (this._sizeDecompressed == undefined) this.buffer;
    return this._sizeDecompressed;
  }

  protected constructor(
    saveBuffer: boolean,
    compressBuffer: boolean,
    compressionType: CompressionType,
    buffer?: Buffer,
    sizeDecompressed?: number,
    owner?: ApiModelBase,
  ) {
    super(owner);
    this._saveBuffer = saveBuffer ?? false;
    this._compressBuffer = compressBuffer ?? false;
    this._compressionType = compressionType ?? CompressionType.Uncompressed;
    this._sizeDecompressed = sizeDecompressed;
    if (saveBuffer) this._buffer = buffer;
  }

  /**
   * Generates the buffer for this model asynchronously, and returns a Promise
   * that resolves with it. To get the buffer synchronously, just access the
   * `buffer` property.
   */
  async getBufferAsync(): Promise<Buffer> {
    return promisify(() => this.buffer);
  }

  /**
   * Returns the buffer for this model in its proper compression format,
   * regardless of the value of `compressBuffer`.
   */
  getCompressedBuffer(): Buffer {
    return this.isCompressed
      ? this.buffer
      : compressBuffer(this.buffer, this.compressionType);
  }

  /**
   * Returns the buffer for this model in its proper compression format
   * asynchronously.
   */
  async getCompressedBufferAsync(): Promise<Buffer> {
    return promisify(() => this.getCompressedBuffer());
  }

  onChange() {
    delete this._buffer;
    delete this._sizeDecompressed;
    super.onChange();
  }

  /** Deletes this model's buffer, if it is able to. */
  protected _deleteBufferIfSupported() {
    delete this._buffer;
  }

  /** Returns a newly serialized buffer for this model. */
  protected abstract _serialize(): Buffer;

  /** Gets the buffer for this model, compressed if need be. */
  private _serializeCompressed(): Buffer {
    const buffer = this._serialize();
    this._sizeDecompressed = buffer.byteLength;
    return this.compressBuffer
      ? compressBuffer(buffer, this.compressionType)
      : buffer;
  }
}
