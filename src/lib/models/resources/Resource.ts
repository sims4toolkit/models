import type ResourceEntry from "../resourceEntry";
import type { ResourceVariant } from "../types";

/**
 * A base for all resources.
 */
export default abstract class Resource {
  /** How this resource is encoded. */
  abstract readonly variant: ResourceVariant;

  private _cachedBuffer: Buffer;
  private _owner?: ResourceEntry;

  constructor(buffer: Buffer) {
    this._cachedBuffer = buffer;
  }

  /**
   * Returns an uncompressed buffer for this resource.
   */
  getBuffer(): Buffer {
    if (this.hasChanged()) this._cachedBuffer = this._serialize();
    return this._cachedBuffer;
  }

  /**
   * Returns `true` if this resource has been modified since the last time it
   * was serialized, and `false` otherwise.
   */
  hasChanged(): boolean {
    return !this._cachedBuffer;
  }

  /**
   * Sets an entry as the owner of this resource. As an owner, the entry will be
   * notified to uncache itself whenever this resource is uncached.
   * 
   * @param owner Entry for this record
   */
  setOwner(owner: ResourceEntry) {
    this._owner = owner;
  }

  /**
   * Clears the cache for this resource.
   */
  uncache() {
    this._cachedBuffer = undefined;
    this._owner?.uncache();
  }

  /** Returns a deep copy of this resource. */
  abstract clone(): Resource;

  /** Serializes this resource into a buffer.  */
  protected abstract _serialize(): Buffer;
}
