import { XmlDocumentNode } from "@s4tk/xml-dom";
import { WritableModelCreationOptions, WritableModelFromOptions } from "../../base/writable-model";
import { bufferContainsDATA, promisify } from "../../common/helpers";
import { XmlExtractionOptions } from "../../common/options";
import BinaryResourceType from "../../enums/binary-resources";
import ResourceRegistry from "../../packages/resource-registry";
import DataResource from "../abstracts/data-resource";
import XmlResource from "../xml/xml-resource";
import extractTuningFromCombinedBinary from "./serialization/extract-from-binary";
import extractTuningFromCombinedXml from "./serialization/extract-from-xml";

/**
 * TODO:
 */
export default class CombinedTuningResource extends DataResource {
  /**
   * TODO:
   * 
   * @param options TODO:
   */
  constructor(
    public readonly resources?: XmlResource[],
    options?: WritableModelCreationOptions
  ) {
    super(options);
    // FIXME: how should this model store data?
  }

  //#region Static Methods

  /**
   * Creates a CombinedTuningResource from a buffer containing either binary
   * DATA or combined tuning XML. This buffer is assumed to be uncompressed;
   * providing a compressed buffer will lead to unexpected behavior.
   * 
   * @param buffer Buffer to read as combined tuning
   * @param options Object of options to configure
   */
  static from(
    buffer: Buffer,
    options?: WritableModelFromOptions
  ): CombinedTuningResource {
    const resources = this.extractTuning(buffer);
    return new CombinedTuningResource(resources);
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
  static async fromAsync(
    buffer: Buffer,
    options?: WritableModelFromOptions
  ): Promise<CombinedTuningResource> {
    return promisify(() => this.from(buffer, options));
  }

  /**
   * Extracts all tunings from a buffer containing either binary DATA or
   * combined tuning XML. This buffer is assumed to be uncompressed;
   * providing a compressed buffer will lead to unexpected behavior.
   * 
   * @param buffer Buffer to extract tuning from
   * @param options Object of options
   */
  static extractTuning(
    buffer: Buffer,
    options?: XmlExtractionOptions
  ): XmlResource[] {
    if (bufferContainsDATA(buffer)) {
      const binaryModel = DataResource._readBinaryDataModel(buffer); // TODO: options?
      return extractTuningFromCombinedBinary(binaryModel, buffer, options);
    } else {
      const dom = XmlDocumentNode.from(buffer);
      return extractTuningFromCombinedXml(dom, options);
    }
  }

  /**
   * Asynchronously extracts all tunings from a buffer containing either binary
   * DATA or combined tuning XML. This buffer is assumed to be uncompressed;
   * providing a compressed buffer will lead to unexpected behavior.
   * 
   * @param buffer Buffer to extract tuning from
   * @param options Object of options
   */
  static async extractTuningAsync(
    buffer: Buffer,
    options?: XmlExtractionOptions
  ): Promise<XmlResource[]> {
    return promisify(() => this.extractTuning(buffer, options));
  }

  // TODO: index tuning

  //#endregion Static Methods

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
