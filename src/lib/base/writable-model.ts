import { CompressionType } from '@s4tk/compression';
import { promisify } from '../common/helpers';
import ApiModelBase from './api-model';

/**
 * Base class for models that can be written to disk.
 */
export default abstract class WritableModel extends ApiModelBase {
  private _buffer?: Buffer;
  private _compressBuffer?: boolean;
  private _compressionType?: CompressionType;
  private _saveBuffer: boolean;
  private _sizeDecompressed?: number;

  /**
   * The buffer to use when writing this model. If a cached buffer is available,
   * it is returned. If there is no cached buffer, the model is serialized on
   * the fly (when this property is retrieved).
   */
  get buffer(): Buffer {
    if (!this.saveBuffer) return this._serialize();
    return this._buffer ??= this._serialize();
  }

  /**
   * How this model's buffer should be compressed when written in a package. If
   *  `saveBuffer` and `compressBuffer` are true, this also dictates how the
   * cached buffer will be compressed.
   */
  public get compressionType(): CompressionType { return this._compressionType; }
  public set compressionType(value: CompressionType) {
    this._compressionType = value;
    if (this._compressBuffer && this.isCached) {
      delete this._buffer;
      delete this._sizeDecompressed;
    }
  }

  /** 
   * Whether this model currently has a cached buffer.
   */
  get isCached(): boolean {
    // intentionally != so that null is captured as well
    return this._buffer != undefined;
  }

  /**
   * Whether this model's cached buffer is compressed using the compression
   * algorithm specified by `compressionType`. If there is no cached buffer,
   * this is always false. 
   */
  get isCompressed(): boolean { return this._isCompressed ?? false; }

  /** Whether or not the buffer should be cached on this model. */
  get saveBuffer() { return this._saveBuffer; }
  set saveBuffer(saveBuffer: boolean) {
    this._saveBuffer = saveBuffer ?? false;
    if (!this._saveBuffer) delete this._buffer;
  }

  protected constructor(
    saveBuffer: boolean = false,
    buffer?: Buffer,
    owner?: ApiModelBase,
  ) {
    super(owner);
    this._saveBuffer = saveBuffer;
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

  onChange() {
    delete this._buffer;
    super.onChange();
  }

  /** Returns a newly serialized buffer for this model. */
  protected abstract _serialize(): Buffer;
}
