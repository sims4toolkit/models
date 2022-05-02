import { XmlDocumentNode } from "@s4tk/xml-dom";
import { WritableModelCreationOptions, WritableModelFromOptions } from "../../base/writable-model";
import { bufferContainsDATA, promisify } from "../../common/helpers";
import { XmlExtractionOptions } from "../../common/options";
import BinaryResourceType from "../../enums/binary-resources";
import ResourceRegistry from "../../packages/resource-registry";
import DataResource from "../abstracts/data-resource";
import XmlResource from "../xml/xml-resource";
import convertBinaryTuningToXml from "./serialization/binary-to-xml";
import extractTuningFromCombinedXml from "./serialization/extract-tunings";

/**
 * TODO:
 */
export default class CombinedTuningResource extends DataResource {
  //#region Initialization

  /**
   * TODO:
   * 
   * @param options TODO:
   */
  constructor(public readonly dom: XmlDocumentNode, options?: WritableModelCreationOptions) {
    super(options);
  }

  /**
   * Creates a CombinedTuningResource from a buffer containing either binary
   * DATA or combined tuning XML. This buffer is assumed to be uncompressed;
   * providing a compressed buffer will lead to unexpected behavior.
   * 
   * @param buffer Buffer to read as combined tuning
   * @param options Object of options to configure
   */
  static from(buffer: Buffer, options?: WritableModelFromOptions): CombinedTuningResource {
    if (bufferContainsDATA(buffer)) {
      const binaryModel = DataResource._readBinaryDataModel(buffer, options);
      var dom = convertBinaryTuningToXml(binaryModel, buffer, options);
    } else {
      var dom = XmlDocumentNode.from(buffer);
    }

    return new CombinedTuningResource(dom);
  }

  /**
   * Asynchronously creates a CombinedTuningResource from a buffer containing
   * either binary DATA or combined tuning XML. This buffer is assumed to be
   * uncompressed; providing a compressed buffer will lead to unexpected
   * behavior.
   * 
   * @param buffer Buffer to read as combined tuning
   * @param options Object of options to configure
   */
  static async fromAsync(buffer: Buffer, options?: WritableModelFromOptions): Promise<CombinedTuningResource> {
    return promisify(() => this.from(buffer, options));
  }

  //#endregion Initialization

  //#region Public Methods

  /**
   * Extracts all tunings in this model as their own XML files.
   * 
   * WARNING: This method has side effects and will alter this model's DOM.
   */
  extractTuning(options?: XmlExtractionOptions): XmlResource[] {
    return extractTuningFromCombinedXml(this.dom, options);
  }

  /**
   * Asynchronously extracts all tunings in this model as their own XML files.
   * 
   * WARNING: This method has side effects and will alter this model's DOM.
   */
  async extractTuningAsync(): Promise<XmlResource[]> {
    return promisify(() => this.extractTuning());
  }

  // TODO: index tuning

  //#endregion Public Methods

  //#region Unsupported Methods

  clone(): CombinedTuningResource {
    throw new Error("Cloning CombinedTuningResource is not supported.");
  }

  equals(other: any): boolean {
    throw new Error("Comparing CombinedTuningResource is not supported.");
  }

  protected _serialize(): Buffer {
    throw new Error("Serializing CombinedTuningResource is not supported.");
  }

  //#endregion Unsupported Methods
}

ResourceRegistry.register(
  CombinedTuningResource,
  type => type === BinaryResourceType.CombinedTuning
);
