import { XmlDocumentNode, XmlNode } from "@s4tk/xml-dom";
import WritableModel, { WritableModelConstArgs } from "../../base/writable-model";
import Resource from "../resource";
import EncodingType from "../../enums/encoding-type";
import { FileReadingOptions } from "../../common/options";
import { promisify } from "../../common/helpers";

//#region Types

/**
 * Additional arguments specific to XML resources.
 */
type XmlResourceAdditionalArgs = Partial<{
  /** Initial XML content as a string. */
  content?: string;

  /** Initial DOM to use for this resource. */
  dom?: XmlDocumentNode;
}>;

/** Arguments for `XmlResource`'s constructor. */
interface XmlResourceConstArgs extends WritableModelConstArgs, XmlResourceAdditionalArgs { };

/** Arguments for `XmlResource.from()`. */
interface XmlResourceFromOptions extends Omit<XmlResourceConstArgs, "buffer"> { };

/** Arguments for `XmlResource.create()`. */
interface XmlResourceCreateArgs extends Omit<XmlResourceFromOptions, "sizeDecompressed"> { };

//#endregion Types

//#region Classes

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

  protected constructor(args: XmlResourceConstArgs) {
    super(args);
    this._content = args.content;
    this._dom = args.dom;
  }

  /**
   * Creates a new XML resource with the given content. If no content is
   * given, the tuning resource is blank. It is recommended to supply just
   * XML content or a DOM, but not both.
   * 
   * @param args Object containing initial content and options
   */
  static create(args: XmlResourceCreateArgs = {}): XmlResource {
    return new XmlResource(args);
  }

  /**
   * Creates an XML resource from a buffer containing XML.
   * 
   * @param buffer Buffer to create an XML resource from
   * @param options Optional arguments for the XML resource
   */
  static from(buffer: Buffer, options?: XmlResourceFromOptions): XmlResource {
    return new XmlResource(Object.assign({ buffer }, options));
  }

  /**
   * Creates an XML resource asynchronously from a buffer containing XML, and
   * returns a Promise that resolves with it.
   * 
   * @param buffer Buffer to create an XML resource from
   * @param options Options for reading and cacheing the XML resource
   */
  static async fromAsync(buffer: Buffer, options?: FileReadingOptions): Promise<XmlResource> {
    return promisify(() => XmlResource.from(buffer, options));
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): XmlResource {
    return new XmlResource({
      buffer: this.isCached ? this.buffer : undefined,
      compressBuffer: this.compressBuffer,
      compressionType: this.compressionType,
      saveBuffer: this.saveBuffer,
      sizeDecompressed: this.sizeDecompressed,
      content: this.content
    });
  }

  equals(other: XmlResource): boolean {
    return other && (this.content === other.content);
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

//#endregion Classes
