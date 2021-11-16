/** How the resource file is encoded. */
export type ResourceVariant = 'XML' | 'DATA' | 'STBL' | undefined;

/**
 * A resource file that contains data. This object knows nothing about its
 * metadata in a DBPF.
 */
export interface Resource {
  /** How this resource is encoded. */
  readonly variant: ResourceVariant;

  /**
   * Returns a buffer that can be used to write this resource in a DBPF. The
   * buffer is NOT compressed – compression is the DBPF's responsibility.
   * 
   * @returns Buffer to write to DBPF
   */
  getBuffer(): Buffer;
}

/**
 * A base class for records in a DBPF.
 */
export abstract class ResourceBase implements Resource {
  abstract readonly variant: ResourceVariant;
  private _cachedBuffer?: Buffer;

  protected constructor(buffer?: Buffer) {
    this._cachedBuffer = buffer;
  }

  getBuffer(): Buffer {
    if (this._cachedBuffer === undefined) this._cachedBuffer = this.serialize();
    return this._cachedBuffer;
  }

  protected abstract serialize(): Buffer;

  protected uncache() {
    this._cachedBuffer = undefined;
  }
}
