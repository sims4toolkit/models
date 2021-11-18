import Resource from "./Resource";
import type { ResourceVariant } from "./Resource";

const DEFAULT_CONTENT = `<?xml version="1.0" encoding="utf-8"?>\n<I c="" i="" m="" n="" s="">\n  \n</I>`;

/**
 * A resource that contains plaintext XML.
 */
export default class TuningResource extends Resource {
  readonly variant: ResourceVariant = 'XML';
  private _content: string;

  private constructor(contents: string, cachedBuffer?: Buffer) {
    super(cachedBuffer);
    this._content = contents;
  }

  /**
   * Creates a new, empty tuning resource. If `blank` is false (default), then
   * the tuning resource will contain boilerplate XML. If it is true, the tuning
   * resource will be entirely blank.
   * 
   * @param blank Whether or not boilerplate XML should be left out
   */
  static create(blank?: boolean): TuningResource {
    return new TuningResource(blank ? '' : DEFAULT_CONTENT);
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
    return Buffer.from(this._content, 'utf-8');
  }

  /**
   * Returns the current content of this tuning resource.
   */
  getContent(): string {
    return this._content;
  }

  /**
   * Updates the content of this resource to a new string containing XML.
   * 
   * @param content New content of this resource
   */
  update(content: string) {
    this._content = content;
    this._uncache();
  }
}
