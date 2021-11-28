import Resource from "./resource";
import type { TunableNode } from "../tunables";
import { parseNode } from "../tunables";

/**
 * Model for a plaintext, XML tuning resource.
 */
export default class TuningResource extends Resource {
  readonly variant = 'XML';
  private _content?: string;
  private _dom?: TunableNode;

  /** Returns the XML content of this tuning resource. */
  get content(): string {
    if (this._content === undefined) this._content = this._dom.toXml();
    return this._content;
  }

  /** Sets the content of this resource, resets the DOM, and uncaches it. */
  set content(content: string) {
    this._content = content;
    this._dom = undefined;
    this.uncache();
  }

  /** Returns the DOM of this tuning resource. */
  get dom(): TunableNode {
    if (this._dom === undefined) this._dom = parseNode(this._content);
    return this._dom;
  }

  //#region Initialization

  private constructor(content: string, buffer?: Buffer) {
    super({buffer});
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
    return new TuningResource(blank ? '' : '');//DEFAULT_CONTENT);
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

  static fromXml(content: string): TuningResource {
    return new TuningResource(content);
  }

  static fromNode(node: TunableNode): TuningResource {
    return undefined;
  }

  // /**
  //  * TODO:
  //  * 
  //  * @param node TODO:
  //  */
  // static fromNode(node: TuningFileNode): TuningResource {
  //   // TODO: impl
  //   return undefined;
  // }

  //#endregion Initialization

  //#region Public Methods

  /**
   * Returns the content of this tuning resource.
   */
  getPlainText(): string {
    if (this._content === undefined) this._content = this._dom.toXml();
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

  getDom(): TunableNode {
    return this._dom; // FIXME: parse dom if it doesn't exist
  }
  
  updateDom(fn: (dom: TunableNode) => void) {
    fn(this.getDom());
    this._content = this._dom.toXml();
  }
  
  uncache() {
    super.uncache(); // TODO: dom?
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