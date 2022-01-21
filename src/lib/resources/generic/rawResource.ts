import Resource from '../resource';

/**
 * Model for resources that have intentionally not been parsed.
 */
export default class RawResource extends Resource {
  readonly variant = 'RAW';
  private _reason?: string;
  private _content?: string;

  /** The contents of this resource as plain text. */
   get plainText(): string {
    return this._content ??= this.buffer.toString('utf-8');
  }

  /** Reason why this resource has not been parsed. */
  get reason(): string {
    return this._reason;
  }

  /**
   * Creates a new RawResource instance. This constructor is not considered to
   * be a part of the public API. Please refer to `from()` instead.
   * 
   * @param buffer Buffer to load into this resource
   * @param reason Reason why this resource is being loaded raw
   */
  protected constructor(buffer: Buffer, reason?: string) {
    super({ buffer });
    this._reason = reason;
  }

  clone(): RawResource {
    return RawResource.from(this.buffer, this.reason);
  }

  equals(other: RawResource): boolean {
    if (!super.equals(other)) return false;
    if (this.reason !== other.reason) return false;
    return this.plainText === other.plainText;
  }

  uncache() {
    // intentionally blank because this resource cannot be uncached
  }

  protected _serialize(): Buffer {
    throw new Error("Cannot serialize a raw resource.");
  }

  /**
   * Creates a new RawResource from the given buffer. This is functionally the
   * same as the constructor, but is provided for parity with the other resource
   * types.
   * 
   * @param buffer Buffer to create a raw resource from
   */
  static from(buffer: Buffer, reason?: string): RawResource {
    return new RawResource(buffer, reason);
  }
}
