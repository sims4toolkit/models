import ApiModelBase from './api-model';

/**
 * Base class for models that can be written to disk.
 */
export default abstract class WritableModel extends ApiModelBase {
  // NOTE: Buffer is fine for now, but look out for memory/time bottlenecks...
  // If it gets worrying, this should be replaced with a stream.
  private _buffer?: Buffer;
  protected _cacheBuffer: boolean;

  /**
   * The buffer for this model.
   */
  get buffer(): Buffer {
    if (!this._cacheBuffer) return this._serialize();
    return this._buffer ??= this._serialize();
  }

  /** 
   * Whether this model currently has a cached buffer.
   */
  get isCached(): boolean {
    // intentionally != so that null is captured as well
    return this._buffer != undefined;
  }

  protected constructor(buffer?: Buffer, owner?: ApiModelBase) {
    super(owner);
    this._cacheBuffer = true; // FIXME: make this a setting
    this._buffer = buffer;
  }

  onChange() {
    delete this._buffer;
    super.onChange();
  }

  /** Returns a newly serialized buffer for this model. */
  protected abstract _serialize(): Buffer;
}
