import type { Resource } from "../../types/resources";


/**
 * A base class for records in a DBPF.
 */
export abstract class ResourceBase implements Resource {
  abstract renderType: RecordType;
  abstract displayName: string;
  private _cachedBuffer: Buffer | undefined;

  protected constructor(buffer: Buffer | undefined) {
    this._cachedBuffer = buffer;
  }

  abstract renderData(): any;

  getBuffer(): Buffer {
    // return this.serialize(); // FIXME: do not keep like this
    if (this.hasChanged()) this._cachedBuffer = this.serialize();
    return this._cachedBuffer;
  }

  hasChanged(): boolean {
    return this._cachedBuffer === undefined;
  }

  /**
   * Serializes the record into a buffer that can be written to a DBPF.
   */
  protected abstract serialize(): Buffer;

  /**
   * Notifies the base class that a change has been made and the cache must be cleared.
   */
  protected onChange() {
    this._cachedBuffer = undefined;
  }
}
