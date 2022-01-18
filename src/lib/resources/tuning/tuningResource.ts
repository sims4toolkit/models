import { XmlDocumentNode } from "@s4tk/xml-dom";
import XmlResource from "../generic/xmlResource";

/**
 * Model for a plaintext, XML tuning resource.
 */
export default class TuningResource extends XmlResource {
  /**
   * Creates a new XmlResource instance. This constructor is not considered to
   * be a part of the public API. Please refer to `create()` and `from()`
   * instead.
   * 
   * @param params Arguments for construction
   */
  protected constructor(params: {
    content?: string;
    buffer?: Buffer;
    dom?: XmlDocumentNode;
  } = {}) {
    super(params);
  }

  clone(): TuningResource {
    return new TuningResource({
      content: this.content,
      dom: this.dom.clone()
    });
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
    dom?: XmlDocumentNode;
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
}
