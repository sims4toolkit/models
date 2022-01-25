import Resource from '../resource';
import { bufferContainsXml } from '../../common/helpers';

/**
 * Model for resources that have not been parsed.
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

  //#region Initialization

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

  //#endregion Initialization

  //#region Public Methods

  clone(): RawResource {
    return RawResource.from(this.buffer, this.reason);
  }

  equals(other: RawResource): boolean {
    if (!super.equals(other)) return false;
    if (this.reason !== other.reason) return false;
    return this.plainText === other.plainText;
  }

  isXml(): boolean {
    return bufferContainsXml(this.buffer);
  }

  onChange() {
    // intentionally blank because this resource cannot be uncached -- the
    // buffer is the only thing that meaningfully defines this resource
  }

  //#endregion Public Methods

  //#region Protected Methods

  protected _serialize(): Buffer {
    throw new Error("Cannot serialize a raw resource.");
  }

  //#endregion Protected Methods
}
