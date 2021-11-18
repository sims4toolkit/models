import Resource from "./Resource";
import type { ResourceVariant } from "./Resource";

const DEFAULT_CONTENT = `<?xml version="1.0" encoding="utf-8"?>\n<I c="" i="" m="" n="" s="">\n  \n</I>`;

/**
 * A resource that contains plaintext XML.
 */
export default class TuningResource extends Resource {
  readonly variant: ResourceVariant = 'XML';
  private _contents: string;

  private constructor(contents: string, cachedBuffer?: Buffer) {
    super(cachedBuffer);
    this._contents = contents;
  }

  /**
   * Creates a new, empty tuning resource. If makeBlank is false (default), then
   * the tuning resource will contain boilerplate XML. If it is true, the tuning
   * resource will be entirely blank.
   * 
   * @param makeBlank Whether or not boilerplate XML should be added in
   */
  static create(makeBlank?: boolean): TuningResource {
    return new TuningResource(DEFAULT_CONTENT);
  }

  /**
   * Creates a tuning resource from a buffer containing XML code. If not passed
   * an encoding, it is assumed to be UTF-8.
   * 
   * @param buffer Buffer to create a tuning resource from
   * @param encoding How the buffer is encoded (UTF-8 by default)
   */
  static from(buffer: Buffer, encoding: BufferEncoding = 'utf-8'): TuningResource {
    return new TuningResource(buffer.toString(encoding), buffer);
  }

  protected _serialize(): Buffer {
    return Buffer.from(this._contents, 'utf-8');
  }

  /**
   * Updates the contents of this resource to a new string containing XML.
   * 
   * @param contents New contents of this resource
   */
  update(contents: string) {
    this._contents = contents;
    this._uncache();
  }
}
