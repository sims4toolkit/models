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
   * Whether or not the buffer cached on and returned by this model should be
   * compressed. For best performance, this should be true when writing
   * resources to packages, and false when writing them to disk by themselves.
   */
  public get compressBuffer(): boolean { return this._compressBuffer; }
  public set compressBuffer(value: boolean) {
    if (this._compressBuffer && this.isCached) delete this._buffer;
    this._compressBuffer = value ?? false;
  }

  /**
   * How this model's buffer should be compressed when written in a package. If
   * `saveBuffer` and `compressBuffer` are true, this also dictates how the
   * cached buffer will be compressed.
   */
  public get compressionType(): CompressionType { return this._compressionType; }
  public set compressionType(value: CompressionType) {
    if (this._compressBuffer && this.isCached) delete this._buffer;
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
    if (!this._saveBuffer) delete this._buffer;
  }

  protected constructor(
    saveBuffer: boolean,
    compressBuffer: boolean,
    compressionType: CompressionType,
    buffer?: Buffer,
    owner?: ApiModelBase,
  ) {
    super(owner);
    this._saveBuffer = saveBuffer ?? false;
    this._compressBuffer = compressBuffer ?? false;
    this._compressionType = compressionType ?? CompressionType.ZLIB;
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
   * Returns the buffer for this model in its proper compression format.
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
    super.onChange();
  }

  /** Returns a newly serialized buffer for this model. */
  protected abstract _serialize(): Buffer;

  /** Gets the buffer for this model, compressed if need be. */
  private _serializeCompressed(): Buffer {
    const buffer = this._serialize();
    return this.compressBuffer
      ? compressBuffer(buffer, this.compressionType)
      : buffer;
  }
}
