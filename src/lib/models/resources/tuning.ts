import Resource from "./resource";
import { makeDom, TunableNode, TuningDom } from "../tunables";
import { parseDom } from "../tunables";

/**
 * Model for a plaintext, XML tuning resource.
 */
export default class TuningResource extends Resource {
  readonly variant = 'XML';
  private _content?: string;
  private _dom?: TuningDom;

  /** Returns the XML content of this tuning resource. */
  get content(): string {
    if (this._content === undefined) this._content = this._dom?.toXml();
    return this._content;
  }

  /** Sets the content of this resource, resets the DOM, and uncaches it. */
  set content(content: string) {
    this._content = content;
    this._dom = undefined;
    this.uncache();
  }

  /**
   * Returns the DOM of this tuning resource. If you need to mutate the DOM, do
   * so with the `updateDom()` method (if you mutate the DOM outside of this
   * method, you will encounter mismatched cache issues).
   */
  get dom(): TuningDom {
    if (this._dom === undefined) this._dom = parseDom(this._content);
    return this._dom;
  }

  //#region Initialization

  private constructor({ content, buffer, dom }: {
    content?: string;
    buffer?: Buffer;
    dom?: TuningDom;
  } = {}) {
    super({ buffer });
    this._content = content;
    this._dom = dom;
  }

  clone(): TuningResource {
    return new TuningResource({ content: this._content });
  }

  /**
   * Creates a new blank tuning resource.
   */
  static create(): TuningResource {
    return new TuningResource();
  }

  /**
   * Creates a tuning resource from a buffer containing XML.
   * 
   * @param buffer Buffer to create a tuning resource from
   */
  static from(buffer: Buffer): TuningResource {
    return new TuningResource({ content: buffer.toString('utf-8'), buffer });
  }

  /**
   * Creates a tuning resource from a string containing XML.
   * 
   * @param content String to create a tuning resource from
   */
  static fromXml(content: string): TuningResource {
    return new TuningResource({ content });
  }

  /**
   * Creates a tuning resource from a variable number of TunableNode objects.
   * The nodes will be wrapped in a TuningDom.
   * 
   * @param nodes Variable number of nodes to create a tuning resource from
   */
  static fromNodes(...nodes: TunableNode[]): TuningResource {
    return TuningResource.fromDom(makeDom(...nodes));
  }

  /**
   * Creates a tuning resource from a TuningDom object.
   * 
   * @param dom DOM to create tuning resource from
   */
  static fromDom(dom: TuningDom): TuningResource {
    return new TuningResource({ dom });
  }

  //#endregion Initialization
  
  /**
   * Allows you to alter the DOM in a way that keeps the content and buffer in
   * sync. If you alter the DOM outside of this method, you can encounter some
   * serious problems with mis-matched caches.
   * 
   * @param fn Callback function where you can alter the DOM
   */
  updateDom(fn: (dom: TunableNode) => void) {
    fn(this.dom);
    this._content = undefined;
    this.uncache();
  }

  protected _serialize(): Buffer {
    return Buffer.from(this._content, 'utf-8');
  }
}
