import type Dbpf from "./dbpf";
import type Resource from "./resources/resource";
import type { ResourceKey } from "./types";

/**
 * Wrapper for a resource in a DBPF to pair it with a key and handle
 * compression. In terms of the DBPF binary template, this would be considered
 * a "Record", but that name is being avoided to reduce confusion with the
 * built-in `Record` type.
 */
export default class ResourceEntry<ResourceType extends Resource = Resource> {
  private _key: ResourceKey;
  private _resource: ResourceType;
  private _owner?: Dbpf;
  private _cachedCompressedBuffer?: Buffer;

  constructor(key: ResourceKey, resource: ResourceType) {
    this._key = key;
    this._resource = resource;
    resource.setOwner(this);
  }

  /**
   * Returns a buffer that can be used to write the contained resource in a
   * DBPF. The buffer is compressed with ZLIB.
   */
  getBuffer(): Buffer {
    if (!this._cachedCompressedBuffer) {
      const buffer = this._resource.getBuffer();
      const compressedBuffer = buffer; // TODO: actually compress
      this._cachedCompressedBuffer = compressedBuffer;
    }

    return this._cachedCompressedBuffer;
  }

  /**
   * Sets a DBPF as the owner of this entry. As an owner, the DBPF will be
   * notified to uncache itself whenever this entry is uncached.
   * 
   * @param owner DBPF that owns this ResourceEntry
   */
  setOwner(owner: Dbpf) {
    this._owner = owner;
  }

  /**
   * Clears the cache for this entry.
   */
  uncache() {
    this._cachedCompressedBuffer = undefined;
    this._owner?.uncache();
  }
}
