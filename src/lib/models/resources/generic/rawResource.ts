import Resource from '../resource';

/**
 * Model for resources that have intentionally not been parsed.
 */
export default class RawResource extends Resource {
  readonly variant = 'RAW';
  private _reason?: string;
  private _content?: string;

  get reason(): string {
    return this._reason;
  }

  private constructor(buffer: Buffer, reason: string) {
    super({ buffer });
    this._reason = reason;
  }

  clone(): RawResource {
    return RawResource.from(this.buffer);
  }

  /**
   * Creates a new raw resource from the given buffer. This is functionally the
   * same as the constructor, but is provided for parity with the other resource
   * types.
   * 
   * @param buffer Buffer to create a raw resource from
   */
  static from(buffer: Buffer, reason?: string): RawResource {
    return new RawResource(buffer, reason);
  }

  protected _serialize(): Buffer {
    throw new Error("Cannot serialize a raw resource.");
  }

  uncache() {
    // intentionally blank because this resource cannot be uncached
  }

  /**
   * Returns this resource as plain text. This is a lazy function, in that the
   * content will not be decoded until this function is called.
   */
  get plainText(): string {
    if (this._content === undefined)
      this._content = this.buffer.toString('utf-8');
    return this._content;
  }
}
