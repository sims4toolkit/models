import type DBPF from "./DBPF";
import type Resource from "./resources/Resource";


/** How a resource file is encoded. */
export type ResourceVariant = 'XML' | 'RAW' | 'DATA' | 'STBL' | undefined;


/**
 * TODO:
 */
export interface ResourceKey {
  type: number;
  group: number;
  instance: bigint;
}


/**
 * TODO:
 */
export default class Record {
  /** The kind of resource that this record contains. */
  readonly variant: ResourceVariant;

  private _owner?: DBPF;
  private _key: ResourceKey;
  private _resource: Resource;
  private _cachedCompressedBuffer: Buffer;

  private constructor(key: ResourceKey, resource: Resource, owner?: DBPF) {
    this._key = key;
    this._resource = resource;
    this._owner = owner;
    // TODO: variant
  }

  /**
   * Returns a buffer that can be used to write this record in a DBPF. The
   * buffer is compressed with ZLIB.
   */
  getBuffer(): Buffer {
    if (this._cachedCompressedBuffer === undefined) {
      const buffer = this._resource.getBuffer();
      const compressedBuffer = buffer; // TODO: actually compress
      this._cachedCompressedBuffer = compressedBuffer;
    }

    return this._cachedCompressedBuffer;
  }

  /**
   * Clears the cached buffer for this record's resource. This should only be
   * called by the contained resource when it is updated.
   */
  protected _uncache() {
    this._cachedCompressedBuffer = undefined;
    //@ts-ignore The _uncache method is meant to be protected so that outside
    // code knows not to call it, but it is totally fine to be called here.
    this._owner?._uncache();
  }
}
