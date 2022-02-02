import { promisify } from '../common/helpers';
import ApiModelBase from './api-model';

/**
 * Base class for models that can be written to disk.
 */
export default abstract class WritableModel extends ApiModelBase {
  // NOTE: Buffer is fine for now, but look out for memory/time bottlenecks...
  // If any come up, it should be replaced with a stream. This would require
  // significant refactoring of the entire codebase, though.
  private _buffer?: Buffer;
  private _saveBuffer: boolean;

  /**
   * The buffer for this model.
   */
  get buffer(): Buffer {
    if (!this.saveBuffer) return this._serialize();
    return this._buffer ??= this._serialize();
  }

  /** 
   * Whether this model currently has a cached buffer.
   */
  get isCached(): boolean {
    // intentionally != so that null is captured as well
    return this._buffer != undefined;
  }

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
