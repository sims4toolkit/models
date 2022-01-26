import { XmlDocumentNode, XmlNode } from "@s4tk/xml-dom";
import WritableModel from "../../base/writable-model";
import Resource from "../resource";
import EncodingType from "../../enums/encoding-type";
import { FileReadingOptions } from "../../common/options";

/**
 * Model for a plain text, XML resource. This does not necessarily need to be
 * tuning, however, the XML DOM is tailored towards use with tuning.
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
      throw new Error(`Failed to write XML for DOM:\n${e}`);
    }
  }

  set content(content: string) {
    this._content = content;
    delete this._dom;
    this.onChange();
  }

  /**
   * The DOM for this resource. To mutate the DOM and keep it in sync with the
   * content/buffer, either use the `updateDom()` method, or set the dom equal
   * to itself when finished (EX: `resource.dom = resource.dom`).
   */
  get dom(): XmlDocumentNode {
    try {
      return this._dom ??= XmlDocumentNode.from(this.content, {
        allowMultipleRoots: true
      });
    } catch (e) {
      throw new Error(`Failed to generate DOM from XML:\n${e}`);
    }
  }

  set dom(dom: XmlDocumentNode) {
    this._dom = dom;
    delete this._content;
    this.onChange();
  }

  /**
   * Shorthand for `dom.child`, since most XML resources should have one child.
   * To mutate the root and keep it in sync with the content/buffer, either use
   * the `updateRoot()` method, or set the root equal to itself when finished
   * (EX: `resource.root = resource.root`).
   */
  get root(): XmlNode { return this.dom.child; }

  set root(node: XmlNode) {
    this.updateDom(dom => {
      dom.child = node;
    });
  }

  //#region Initialization

  protected constructor(
    content?: string,
    dom?: XmlDocumentNode,
    saveBuffer?: boolean,
    buffer?: Buffer
  ) {
    super(saveBuffer, buffer);
    this._content = content;
    this._dom = dom;
  }

  /**
   * Creates a new XML resource with the given content. If no content is
   * given, the tuning resource is blank. It is recommended to supply just
   * XML content or a DOM, but not both (because the model assumes the content
   * and DOM will always be in sync, but this cannot be guaranteed if both are
   * user-supplied rather than one being generated from the other).
   * 
   * Options
   * - `content`: The XML content of the resource as a string.
   * - `dom`: The XmlDocumentNode to use as this resource's DOM.
   * - `saveBuffer`: Whether or not buffers created for this resource should
   * be cached. False by default.
   * 
   * @param options Object containing initial content of this resource
   */
  static create({ content, dom, saveBuffer }: {
    content?: string;
    dom?: XmlDocumentNode;
    saveBuffer?: boolean;
  } = {}): XmlResource {
    return new XmlResource(content, dom, saveBuffer);
  }

  /**
   * Creates an XML resource from a buffer containing XML.
   * 
   * @param buffer Buffer to create an XML resource from
   * @param options Options for reading the buffer
   */
  static from(buffer: Buffer, options?: FileReadingOptions): XmlResource {
    return new XmlResource(
      buffer.toString('utf-8'),
      undefined,
      options?.saveBuffer,
      buffer
    );
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): XmlResource {
    // copy content only, it is pointless to clone the entire DOM structure
    // because it can just be generated
    const buffer = this.isCached ? this.buffer : undefined;
    return new XmlResource(this.content, undefined, this.saveBuffer, buffer);
  }

  equals(other: XmlResource): boolean {
    return other && this.content === other.content;
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
