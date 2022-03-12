import { compressBuffer, CompressionType } from '@s4tk/compression';
import ApiModelBase from './api-model';
import { promisify } from '../common/helpers';

//#region Types

/**
 * Constructor arguments for writable models.
 */
export type WritableModelConstArgs = Partial<{
  /** Initial buffer for this model. */
  buffer: Buffer;

  /** Whether or not the buffer is/should be compressed by the model. */
  compressBuffer: boolean;

  /**
   * How the buffer is/should be compressed. If `compressBuffer` is true, this
   * also dictates how the buffer returned by the model is compressed. If
   * `compressBuffer` is false, this only determines how the buffer is
   * compressed when written in a package.
   */
  compressionType: CompressionType;

  /** The model that contains this one.  */
  owner: ApiModelBase;

  /** Whether or not this model should cache its buffer. */
  saveBuffer: boolean;

  /** The number of bytes this model's buffer requires when decompressed. */
  sizeDecompressed: number;
}>;

//#endregion Types

//#region Classes

/**
 * Base class for models that can be written to disk.
 */
export default abstract class WritableModel extends ApiModelBase {
  //#region Properties

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

  //#endregion Properties

  //#region Initialization

  protected constructor(args: WritableModelConstArgs) {
    super(args.owner);
    this._saveBuffer = args.saveBuffer ?? false;
    this._compressBuffer = args.compressBuffer ?? false;
    this._compressionType = args.compressionType ?? CompressionType.Uncompressed;
    this._sizeDecompressed = args.sizeDecompressed;
    if (args.saveBuffer) this._buffer = args.buffer;
  }

  //#endregion Initialization

  //#region Public Methods

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

  //#endregion Public Methods

  //#region Protected Methods

  /** Deletes this model's buffer, if it is able to. */
  protected _deleteBufferIfSupported() {
    delete this._buffer;
  }

  /** Returns a newly serialized buffer for this model. */
  protected abstract _serialize(): Buffer;

  //#endregion Protected Methods

  //#region Private Methods

  /** Gets the buffer for this model, compressed if need be. */
  private _serializeCompressed(): Buffer {
    const buffer = this._serialize();
    this._sizeDecompressed = buffer.byteLength;
    return this.compressBuffer
      ? compressBuffer(buffer, this.compressionType)
      : buffer;
  }

  //#endregion Private Methods
}

//#endregion Classes
