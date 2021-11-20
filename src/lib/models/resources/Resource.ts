import type Record from "../Record";

/** How a resource file is encoded. */
export type ResourceVariant = 'RAW' | 'XML' | 'DATA' | 'STBL' | undefined;

/**
 * A base class for resources that contain data. Resources know nothing about
 * their metadata in a DBPF, but do containg a reference to their owning record,
 * if they have one.
 */
export default abstract class Resource {
  /** How this resource is encoded. */
  readonly variant: ResourceVariant;

  private _cachedBuffer: Buffer;
  private _owner?: Record;

  protected constructor(buffer: Buffer) {
    this._cachedBuffer = buffer;
  }

  /**
   * Returns a buffer that can be used to write this resource. The buffer is NOT
   * compressed -- compression is the responsibility of a record.
   */
  getBuffer(): Buffer {
    if (this._cachedBuffer === undefined)
      this._cachedBuffer = this._serialize();
    return this._cachedBuffer;
  }

  /**
   * Returns a deep copy of this resource.
   */
  abstract clone(): Resource;

  /**
   * Serializes this resource into a new buffer if a cached one is unavailable.
   */
  protected abstract _serialize(): Buffer;

  /**
   * Clears the cached buffer for this resource. This should be called every
   * time the resource is changed in some way.
   */
  protected _uncache() {
    this._cachedBuffer = undefined;
    //@ts-ignore The _uncache method is meant to be protected so that outside
    // code knows not to call it, but it is totally fine to be called here.
    this._owner?._uncache();
  }

  /**
   * Sets the given record as the owner of this resource.
   * 
   * This is marked as private so that external code knows not to call it, but
   * it is called by the constructor of records.
   * 
   * @param owner Record that contains this resource
   */
  private _setOwner(owner: Record) {
    this._owner = owner;
  }
}
