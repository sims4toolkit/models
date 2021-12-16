import CacheableModel from './cacheableModel';

/**
 * A base for models that have a buffer that can be written to disk. The buffer
 * is cached until any changes are made.
 */
export default abstract class WritableModel extends CacheableModel {
  private _cachedBuffer?: Buffer;

  constructor({ buffer, owner }: {
    buffer?: Buffer;
    owner?: WritableModel;
  } = {}) {
    super(owner);
    this._cachedBuffer = buffer;
  }

  /**
   * The buffer for this model. The cached buffer will be used, if available,
   * otherwise it will be serialized.
   */
  get buffer(): Buffer {
    if (this.hasChanged) this._cachedBuffer = this._serialize();
    return this._cachedBuffer;
  }

  /** 
   * Whether the model has changed since the last time it was serialized.
   */
  get hasChanged(): boolean {
    return this._cachedBuffer === undefined;
  }

  uncache() {
    this._cachedBuffer = undefined;
    super.uncache();
  }

  /** Returns a newly serialized buffer for this model. */
  protected abstract _serialize(): Buffer;
}
