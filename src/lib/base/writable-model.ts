import CacheableModel from './cacheable-model';

/**
 * Base class for models that have a buffer that can be written to disk. The
 * buffer is cached until any changes are made to the model or any of its
 * children.
 */
export default abstract class WritableModel extends CacheableModel {
  private _cachedBuffer?: Buffer;

  /**
   * The buffer for this model. The cached buffer will be used, if available,
   * otherwise it will be serialized. To force the model to re-serialize (i.e.
   * throw out the cache and generate a new buffer), call `uncache()` first.
   */
  get buffer(): Buffer {
    return this._cachedBuffer ??= this._serialize();
  }

  /** 
   * Whether the model has changed since the last time it was serialized. This
   * is the same as checking if the model does not have a cached buffer.
   */
  get hasChanged(): boolean {
    return this._cachedBuffer == undefined;
  }

  /** 
   * Whether this model has a cached buffer. This is the same as checking if the
   * model has not changed.
   */
  get isCached(): boolean {
    return this._cachedBuffer != undefined;
  }

  protected constructor(args?: {
    buffer?: Buffer;
    owner?: CacheableModel;
  }) {
    super(args?.owner);
    this._cachedBuffer = args?.buffer;
  }

  uncache() {
    delete this._cachedBuffer;
    super.uncache();
  }

  /** Returns a newly serialized buffer for this model. */
  protected abstract _serialize(): Buffer;
}
