import { XmlDocumentNode } from "@s4tk/xml-dom";
import { WritableModelCreationOptions, WritableModelFromOptions } from "../../base/writable-model";
import { bufferContainsDATA, promisify } from "../../common/helpers";
import { BinaryFileReadingOptions, XmlExtractionOptions } from "../../common/options";
import BinaryResourceType from "../../enums/binary-resources";
import ResourceRegistry from "../../packages/resource-registry";
import DataResource, { BinaryDataResourceDto } from "../abstracts/data-resource";
import XmlResource from "../xml/xml-resource";
import convertCombinedBinaryToXml from "./serialization/binary-to-xml";
import extractTuningFromCombinedXml from "./serialization/extract-tuning";

/**
 * Read-only model for combined tuning resources. Note that resource keys are
 * NOT specified in combined tuning - you must infer the type from the `R`
 * node's `n` attribute, and the group will match that of the CombinedTuning
 * that contains the resource.
 */
export default class CombinedTuningResource extends DataResource {
  /**
   * Creates a new CombinedTuningResource from the given XML DOM.
   * 
   * @param dom DOM to use for this Combined Tuning resource
   * @param options Object of options
   */
  constructor(
    public readonly dom: XmlDocumentNode,
    options?: WritableModelCreationOptions
  ) {
    super(options);
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
    return new CombinedTuningResource(
      bufferContainsDATA(buffer)
        ? convertCombinedBinaryToXml(
          CombinedTuningResource.readBinaryDataModel(buffer, options),
          buffer
        )
        : XmlDocumentNode.from(buffer)
    );
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
    return extractTuningFromCombinedXml(
      bufferContainsDATA(buffer)
        ? convertCombinedBinaryToXml(
          CombinedTuningResource.readBinaryDataModel(buffer),
          buffer,
          options
        )
        : XmlDocumentNode.from(buffer),
      options
    );
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

  /**
   * Returns a DTO for a binary CombinedTuningResource.
   * 
   * @param buffer Buffer to read as DATA file
   * @param options Options to configure
   */
  static readBinaryDataModel(
    buffer: Buffer,
    options?: BinaryFileReadingOptions
  ): BinaryDataResourceDto {
    return DataResource._readBinaryDataModel(buffer, true, options);
  }

  /**
   * Asynchronously returns a DTO for a binary CombinedTuningResource.
   * 
   * @param buffer Buffer to read as DATA file
   * @param options Options to configure
   */
  static async readBinaryDataModelAsync(
    buffer: Buffer,
    options?: BinaryFileReadingOptions
  ): Promise<BinaryDataResourceDto> {
    return promisify(
      () => CombinedTuningResource.readBinaryDataModel(buffer, options)
    );
  }

  //#endregion Static Methods

  //#region Public Methods

  /**
   * Extracts all tunings from the DOM in this CombinedTuningResource. Note that
   * the result of this method is not cached, so you should avoid calling it
   * more than once.
   * 
   * @param options Object of options
   */
  toTuning(options?: XmlExtractionOptions): XmlResource[] {
    return extractTuningFromCombinedXml(this.dom, options);
  }

  /**
   * Asynchronously extracts all tunings from the DOM in this
   * CombinedTuningResource. Note that the result of this method is not cached,
   * so you should avoid calling it more than once.
   * 
   * @param options Object of options
   */
  async toTuningAsync(options?: XmlExtractionOptions): Promise<XmlResource[]> {
    return promisify(() => this.toTuning(options));
  }

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
