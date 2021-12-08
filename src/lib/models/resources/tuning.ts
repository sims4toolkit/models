import Resource from "./resource";
import { TuningDocumentNode, TuningNode } from "../dom/nodes";

/**
 * Model for a plaintext, XML tuning resource.
 */
export default class TuningResource extends Resource {
  readonly variant = 'XML';
  private _content?: string;
  private _dom?: TuningDocumentNode;

  /** The XML content of this tuning resource. */
  get content(): string {
    if (this._content == undefined) this._content = this._dom?.toXml() || '';
    return this._content;
  }

  /** Sets the plain text content, resets the DOM, and uncaches the resource. */
  set content(content: string) {
    this._content = content;
    this._dom = undefined;
    this.uncache();
  }

  /**
   * The DOM for this tuning resource. To mutate the DOM, use `updateDom()` so
   * that cache is handled properly.
   */
  get dom(): TuningDocumentNode {
    if (this._dom == undefined)
      this._dom = TuningDocumentNode.from(this.content, {
        allowMultipleRoots: true
      });
    return this._dom;
  }

  /**
   * Sets the DOM, resets the plain text content, and uncaches the resource.
   */
  set dom(dom: TuningDocumentNode) {
    this._dom = dom;
    this._content = undefined;
    this.uncache();
  }

  /**
   * Shorthand for getting the first child of the DOM, since tuning resources
   * should only have one child in their DOM anyways. To mutate the root, use
   * `updateRoot()` so that the cache is handled properly.
   */
  get root(): TuningNode {
    return this.dom.child;
  }

  /**
   * Sets the first child of the DOM, resets the plain text content, and
   * uncaches the resource.
   */
  set root(node: TuningNode) {
    this.updateDom(dom => {
      dom.child = node;
    });
  }

  //#region Initialization

  private constructor({ content, buffer, dom }: {
    content?: string;
    buffer?: Buffer;
    dom?: TuningDocumentNode;
  } = {}) {
    super({ buffer });
    this._content = content;
    this._dom = dom;
  }

  clone(): TuningResource {
    return new TuningResource({ content: this._content });
  }

  /**
   * Creates a new tuning resource with the given content. If no content is
   * given, the tuning resource is blank.
   * 
   * Initial Content
   * - `content`: The XML content of the resource as a string.
   * - `dom`: The TuningDocumentNode to use as this resource's DOM.
   * 
   * @param initialContent Object containing initial content of this resource
   */
  static create(initialContent: {
    content?: string;
    dom?: TuningDocumentNode;
  } = {}): TuningResource {
    return new TuningResource(initialContent);
  }

  /**
   * Creates a tuning resource from a buffer containing XML.
   * 
   * @param buffer Buffer to create a tuning resource from
   */
  static from(buffer: Buffer): TuningResource {
    return new TuningResource({ content: buffer.toString('utf-8'), buffer });
  }

  //#endregion Initialization
  
  /**
   * Allows you to alter the DOM in a way that keeps the content and buffer in
   * sync. If you alter the DOM outside of this method, you can encounter some
   * problems with mis-matched caches.
   * 
   * @param fn Callback function in which you can alter the DOM
   */
  updateDom(fn: (dom: TuningDocumentNode) => void) {
    fn(this.dom);
    this._content = undefined;
    this.uncache();
  }

  /**
   * Allows you to alter the first child of the DOM in a way that keeps the
   * content and buffer in sync. If you alter the DOM outside of this method,
   * you can encounter some problems with mis-matched caches.
   * 
   * @param fn Callback function in which you can alter the root of the DOM
   */
  updateRoot(fn: (root: TuningNode) => void) {
    fn(this.root);
    this._content = undefined;
    this.uncache();
  }

  protected _serialize(): Buffer {
    return Buffer.from(this._content, 'utf-8');
  }
}
