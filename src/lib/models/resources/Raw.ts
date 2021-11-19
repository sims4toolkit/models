import Resource from './Resource';
import type { ResourceVariant } from './Resource';

/**
 * Model for resource types that may or may not be supported by the library, but
 * have intentionally not been parsed. These models are read-only, and can be
 * read either with their buffer or as plain text (legibility is not guaranteed,
 * as it may contain binary data).
 */
export default class RawResource extends Resource {
  readonly variant: ResourceVariant = 'RAW';
  private _encoding: BufferEncoding;
  private _content?: string;

  /**
   * Constructor. This should NOT be used by external code. Please use the
   * static `from()` method to create new instances.
   * 
   * @param buffer Buffer that contains this resource's raw data
   * @param encoding How the given buffer is encoded
   */
  private constructor(buffer: Buffer, encoding: BufferEncoding) {
    super(buffer);
    this._encoding = encoding;
  }

  /**
   * Creates a new raw resource from the given buffer, and reads it in the given
   * encoding (UTF-8 if not provided). Reading the buffer is done lazily, it
   * will not actually be decoded until `plainText()` is called.
   * 
   * @param buffer Buffer to create a raw resource from
   * @param encoding How the buffer is encoded
   */
  public static from(buffer: Buffer, encoding: BufferEncoding = 'utf-8'): RawResource {
    return new RawResource(buffer, encoding);
  }

  protected _serialize(): Buffer {
    throw new Error("Cannot serialize a raw resource.");
  }

  /**
   * Returns this resource as plain text, using the encoding that was given when
   * it was originally created. Content is loaded lazily, meaning that it will
   * not actually be decoded until this function is called for the first time.
   */
  public getPlainText(): string {
    if (this._content === undefined)
      this._content = this.getBuffer().toString(this._encoding);
    return this._content;
  }
}
