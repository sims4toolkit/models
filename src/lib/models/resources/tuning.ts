import Resource from "./resource";
import { TunableNode } from "../tunables/tunable";

/**
 * Model for a plaintext, XML tuning resource.
 */
export default class TuningResource extends Resource {
  readonly variant = 'XML';
  private _content?: string;
  private _model?: TunableNode;

  //#region Initialization

  private constructor(content: string, cachedBuffer?: Buffer) {
    super(cachedBuffer);
    this._content = content;
  }

  clone(): TuningResource {
    return new TuningResource(this._content);
  }

  /**
   * Creates a new tuning resource. It will come with boilerplate XML unless 
   * `blank` is set to `true`.
   * 
   * @param blank Whether or not the tuning file should be empty
   */
  static create(blank?: boolean): TuningResource {
    return new TuningResource(blank ? '' : DEFAULT_CONTENT);
  }

  /**
   * Creates a tuning resource from a buffer containing XML code that is encoded
   * with the given encoding. If no encoding is given, it will be read as UTF-8.
   * 
   * @param buffer Buffer to create a tuning resource from
   * @param encoding How the buffer is encoded (UTF-8 by default)
   */
  static from(buffer: Buffer, encoding: BufferEncoding = 'utf-8'): TuningResource {
    return new TuningResource(buffer.toString(encoding), buffer);
  }

  /**
   * TODO:
   * 
   * @param node TODO:
   */
  static fromNode(node: TuningFileNode): TuningResource {
    // TODO: impl
    return undefined;
  }

  //#endregion Initialization

  //#region Public Methods

  /**
   * Returns the content of this tuning resource.
   */
  getContent(): string {
    return this._content;
  }

  /**
   * Updates the content of this resource to a new string containing XML.
   * 
   * @param content New content of this resource
   */
  updateContent(content: string) {
    this._content = content;
    this.uncache();
  }

  uncache() {
    super.uncache();
    this._model = undefined;
  }

  //#endregion Public Methods

  //#region Protected Methods

  protected _serialize(): Buffer {
    return Buffer.from(this._content, 'utf-8');
  }

  //#endregion Protected Methods

  //#region Private Methods

  // TODO:

  //#endregion Private Methods
}
