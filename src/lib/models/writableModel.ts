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

  /**
   * Constructor for `WritableModel`.
   * 
   * Arguments
   * - `buffer`: The initial buffer to cache.
   * 
   * @param args Object containing arguments
   */
  protected constructor({ buffer }: {
    buffer?: Buffer;
  } = {}) {
    this._cachedBuffer = buffer;
  }

  /**
   * Returns the buffer for this model. If you want to ensure that the cache is
   * cleared before the buffer is returned, call `uncache()` first.
   */
  get buffer(): Buffer {
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