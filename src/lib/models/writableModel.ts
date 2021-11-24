/**
 * A base for models that have a buffer that can be written to disk. This model
 * takes care of cacheing, if needed.
 */
export default abstract class WritableModel {
  /**
   * The model that contains this one. As an owner, it will be uncached whenever
   * this model is uncached.
   */
  public owner?: WritableModel;

  private _cachedBuffer?: Buffer;
  private _neverCache: boolean;

  /**
   * Constructor for `WritableModel`.
   * 
   * Arguments
   * - `buffer`: The initial buffer to cache.
   * - `neverCache`: Whether this model should never be cached.
   * 
   * @param args Object containing arguments
   */
  protected constructor({ buffer, neverCache = false }: {
    buffer?: Buffer;
    neverCache?: boolean;
  } = {}) {
    this._cachedBuffer = buffer;
    this._neverCache = neverCache;
  }

  /**
   * Returns the buffer for this model. If it was created with `neverCache` set
   * to `true`, then a freshly serialized buffer is guaranteed to be returned.
   * If a fresh buffer is needed without `neverCache`, just call `uncache()`
   * before getting the buffer.
   */
  get buffer(): Buffer {
    if (this._neverCache) return this._serialize();
    if (this.hasChanged) this._cachedBuffer = this._serialize();
    return this._cachedBuffer;
  }

  /** Returns whether the model has changed since the last serialization. */
  get hasChanged(): boolean {
    return this._cachedBuffer === undefined;
  }

  /** Uncaches this model's buffer and notifies its owner to uncache. */
  uncache() {
    this._cachedBuffer = undefined;
    this.owner?.uncache();
  }

  /** Returns a newly serialized buffer for this file. */
  protected abstract _serialize(): Buffer;
}