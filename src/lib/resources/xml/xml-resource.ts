import { XmlDocumentNode, XmlNode } from "@s4tk/xml-dom";
import WritableModel from "../../base/writable-model";
import EncodingType from "../../enums/encoding-type";
import Resource from "../resource";

/**
 * Model for a plaintext, XML resource.
 */
export default class XmlResource extends WritableModel implements Resource {
  readonly encodingType: EncodingType = EncodingType.XML;
  private _content?: string;
  private _dom?: XmlDocumentNode;

  /** The XML content of this resource. */
  get content(): string {
    try {
      return this._content ??= this._dom?.toXml() ?? '';
    } catch (e) {
      throw new Error(`Failed to convert XML DOM to plain text:\n${e}`);
    }
  }

  set content(content: string) {
    this._content = content;
    delete this._dom;
    this.onChange();
  }

  /**
   * The DOM for this resource. To mutate the contents of the DOM, either use
   * `updateDom()` or set this property so that cacheing is handled properly.
   */
  get dom(): XmlDocumentNode {
    try {
      return this._dom ??= XmlDocumentNode.from(this.content, {
        allowMultipleRoots: true
      });
    } catch (e) {
      throw new Error(`Failed to generate DOM for XML:\n${e}`);
    }
  }

  set dom(dom: XmlDocumentNode) {
    this._dom = dom;
    this._content = undefined;
    this.onChange();
  }

  /**
   * Shorthand for `dom.child`, since most XML resources should only have one
   * child anyways. To mutate the root, either use `updateRoot()` or set this
   * property so that cacheing is handled properly.
   */
  get root(): XmlNode {
    return this.dom.child;
  }

  set root(node: XmlNode) {
    this.updateDom(dom => {
      dom.child = node;
    });
  }

  //#region Initialization

  /**
   * Creates a new XmlResource instance. This constructor is not considered to
   * be a part of the public API. Please refer to `create()` and `from()`
   * instead.
   * 
   * @param params Arguments for construction
   */
  protected constructor(
    content?: string,
    dom?: XmlDocumentNode,
    buffer?: Buffer
  ) {
    super(buffer);
    this._content = content;
    this._dom = dom;
  }

  /**
   * Creates a new XML resource with the given content. If no content is
   * given, the tuning resource is blank.
   * 
   * Initial Content
   * - `content`: The XML content of the resource as a string.
   * - `dom`: The XmlDocumentNode to use as this resource's DOM.
   * 
   * @param initialContent Object containing initial content of this resource
   */
  static create({ content, dom }: {
    content?: string;
    dom?: XmlDocumentNode;
  } = {}): XmlResource {
    return new XmlResource(content, dom);
  }

  /**
   * Creates an XML resource from a buffer containing XML.
   * 
   * @param buffer Buffer to create an XML resource from
   */
  static from(buffer: Buffer): XmlResource {
    return new XmlResource(buffer.toString('utf-8'), undefined, buffer);
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): XmlResource {
    // copy content only, it is pointless to clone the entire DOM structure
    // because it can just be generated
    const buffer = this.isCached ? this.buffer : undefined;
    return new XmlResource(this.content, undefined, buffer);
  }

  equals(other: XmlResource): boolean {
    // TODO: check length
    return this.content === other.content;
  }

  isXml(): boolean {
    return true;
  }
  
  /**
   * Accepts a callback function to which the DOM is passed as an argument, so
   * that it can be mutated in a way that ensures cacheing is handled properly.
   * 
   * @param fn Callback function in which the DOM can be altered
   */
  updateDom(fn: (dom: XmlDocumentNode) => void) {
    fn(this.dom);
    delete this._content;
    this.onChange();
  }

  /**
   * Accepts a callback function to which the DOM's root element (i.e. its
   * first, and hopefully only, child) is passed as an argument, so that it can
   * be mutated in a way that ensures cacheing is handled properly.
   * 
   * @param fn Callback function in which the DOM root can be altered
   */
  updateRoot(fn: (root: XmlNode) => void) {
    fn(this.root);
    delete this._content;
    this.onChange();
  }

  validate(): void {
    try {
      this.content;
      this.dom;
    } catch (e) {
      throw new Error(`Expected XML model to have a valid DOM:\n${e}`);
    }
  }

  //#endregion Public Methods

  //#region Protected Methods

  protected _serialize(): Buffer {
    return Buffer.from(this.content, 'utf-8');
  }

  //#endregion Protected Methods
}
