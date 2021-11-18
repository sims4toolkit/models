import Resource from "./Resource";
import type { ResourceVariant } from "./Resource";

const DEFAULT_CONTENT = `<?xml version="1.0" encoding="utf-8"?>\n<I c="" i="" m="" n="" s="">\n  \n</I>`;

/**
 * A resource that contains plaintext XML.
 */
export default class TuningResource extends Resource {
  //#region Properties

  readonly variant: ResourceVariant = 'XML';
  private _content: string;

  //#endregion Properties

  //#region Initialization

  private constructor(contents: string, cachedBuffer?: Buffer) {
    super(cachedBuffer);
    this._content = contents;
  }

  /**
   * Creates a new tuning resource. It will come with boilerplate XML unless 
   * `blank` is set to `true`.
   * 
   * @param blank Whether or not the tuning file should be empty
   */
  public static create(blank?: boolean): TuningResource {
    return new TuningResource(blank ? '' : DEFAULT_CONTENT);
  }

  /**
   * Creates a tuning resource from a buffer containing XML code that is encoded
   * with the given encoding. If no encoding is given, it will be read as UTF-8.
   * 
   * @param buffer Buffer to create a tuning resource from
   * @param encoding How the buffer is encoded (UTF-8 by default)
   */
  public static from(buffer: Buffer, encoding: BufferEncoding = 'utf-8'): TuningResource {
    return new TuningResource(buffer.toString(encoding), buffer);
  }

  //#endregion Initialization

  //#region Abstract Methods

  protected _serialize(): Buffer {
    return Buffer.from(this._content, 'utf-8');
  }

  //#endregion Abstract Methods

  //#region Public Methods

  /**
   * Returns the content of this tuning resource.
   */
  public getContent(): string {
    return this._content;
  }

  /**
   * Updates the content of this resource to a new string containing XML.
   * 
   * @param content New content of this resource
   */
  public updateContent(content: string) {
    this._content = content;
    this._uncache();
  }

  //#endregion Public Methods
}
