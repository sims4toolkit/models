/**
 * A base for models that have a buffer that can be written to disk. This model
 * takes care of cacheing, if needed.
 */
export default abstract class WritableFile {
  private _cachedBuffer?: Buffer;
  private _neverCache: boolean;

  protected constructor(buffer: Buffer, neverCache = false) {
    this._cachedBuffer = buffer;
    this._neverCache = neverCache;
  }

  /**
   * Returns the buffer for this model. If it was created with `neverCache` set
   * to `true`, then a fresh buffer is guaranteed to be returned.
   * 
   * Options
   * - `forceUncache`: If set to true, any existing cache will be cleared before
   * serializing and returning the buffer.
   * 
   * @param options Object containing options
   */
  getBuffer({ forceUncache = false } = {}): Buffer {
    if (this._neverCache) return this._serialize();
    if (forceUncache) this.uncache();
    if (this.hasChanged) this._cachedBuffer = this._serialize();
    return this._cachedBuffer;
  }

  /** Returns whether the model has changed since the last serialization. */
  get hasChanged(): boolean {
    return this._cachedBuffer === undefined;
  }

  /** Uncaches the buffer. */
  uncache() {
    this._cachedBuffer = undefined;
  }

  /** Returns a newly serialized buffer for this file. */
  protected abstract _serialize(): Buffer;
}