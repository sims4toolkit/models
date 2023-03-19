import { CompressedBuffer, CompressionType } from "@s4tk/compression";
import { XmlDocumentNode, XmlNode } from "@s4tk/xml-dom";
import WritableModel, { WritableModelCreationOptions, WritableModelFromOptions } from "../../base/writable-model";
import Resource from "../resource";
import EncodingType from "../../enums/encoding-type";
import { bufferContainsXml, promisify } from "../../common/helpers";
import ResourceRegistry from "../../packages/resource-registry";
import TuningResourceType from "../../enums/tuning-resources";

/** Arguments for XmlResource `from()` methods. */
export interface XmlResourceFromOptions extends
  WritableModelFromOptions,
  Partial<{
    /** How the provided buffer is encoded. UTF8 by default. */
    bufferEncoding: BufferEncoding;
  }> { };

/**
 * Model for a plain text, XML resource. This does not necessarily need to be 
 * tuning (e.g. it can load XML-formatted SimDatas, ASMs, etc.), however, the
 * XML DOM is tailored towards use with tuning.
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
      return this._dom ??= XmlDocumentNode.from(this.content);
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

  /**
   * Creates a new XML resource with the given content. If no content is given,
   * the tuning resource is blank.
   *
   * @param content Either string or DOM content of this model
   * @param options Object of optional arguments
   */
  constructor(content: string | XmlDocumentNode = "", options?: WritableModelCreationOptions) {
    super(options);

    if (!content || (typeof content === "string")) {
      this._content = (content as string) ?? "";
    } else {
      this._dom = content;
    }
  }

  /**
   * Creates an XML resource from a buffer containing XML. This buffer is
   * assumed to be uncompressed; providing a compressed buffer will lead to
   * unexpected behavior.
   * 
   * @param buffer Uncompressed buffer to create an XML resource from
   * @param options Object of optional arguments
   */
  static from(buffer: Buffer, options?: XmlResourceFromOptions): XmlResource {
    let initialBufferCache: CompressedBuffer;
    if (options?.saveBuffer) initialBufferCache = options?.initialBufferCache ?? {
      buffer,
      compressionType: CompressionType.Uncompressed,
      sizeDecompressed: buffer.byteLength
    };

    return new XmlResource(buffer.toString(options?.bufferEncoding ?? "utf8"), {
      defaultCompressionType: options?.defaultCompressionType,
      owner: options?.owner,
      initialBufferCache,
    });
  }

  /**
   * Asynchronously creates an XML resource from a buffer containing XML. This
   * buffer is assumed to be uncompressed; providing a compressed buffer will
   * lead to unexpected behavior.
   * 
   * @param buffer Uncompressed buffer to create an XML resource from
   * @param options Object of optional arguments
   */
  static async fromAsync(buffer: Buffer, options?: XmlResourceFromOptions): Promise<XmlResource> {
    return promisify(() => XmlResource.from(buffer, options));
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): XmlResource {
    return new XmlResource(this.content, {
      defaultCompressionType: this.defaultCompressionType,
      initialBufferCache: this.bufferCache
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

  protected _serialize(minify?: boolean): Buffer {
    const xmlContent = minify
      ? this.dom.toXml({
        minify: true,
        writeComments: false,
        writeProcessingInstructions: false
      })
      : this.content;

    return Buffer.from(xmlContent, "utf-8");
  }

  //#endregion Protected Methods
}

ResourceRegistry.register(
  XmlResource,
  (type, buffer) => (type in TuningResourceType) || bufferContainsXml(buffer)
);
