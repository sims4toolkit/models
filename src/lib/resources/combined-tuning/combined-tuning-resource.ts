import { XmlDocumentNode } from "@s4tk/xml-dom";
import { WritableModelCreationOptions, WritableModelFromOptions } from "../../base/writable-model";
import { bufferContainsDATA, promisify } from "../../common/helpers";
import { BinaryFileReadingOptions, XmlExtractionOptions } from "../../common/options";
import BinaryResourceType from "../../enums/binary-resources";
import ResourceRegistry from "../../packages/resource-registry";
import DataResource, { BinaryDataResourceDto } from "../abstracts/data-resource";
import XmlResource from "../xml/xml-resource";
import convertCombinedBinaryToXml from "./serialization/binary-to-xml";
import combineTunings from "./serialization/combine-xml";
import extractTuningFromCombinedXml from "./serialization/extract-tuning";

/** Arguments for CombinedTuningResource's constructor. */
export interface CombinedTuningResourceCreationOptions extends
  WritableModelCreationOptions,
  Partial<{
    /**
     * Whether or not to write the CombinedTuningResource in binary DATA format.
     * False by default.
     */
    writeBinary: boolean;
  }> { };

/**
 * Model for combined tuning resources. Note that resource keys are NOT
 * specified in combined tuning - you must infer the type from the `R`
 * node's `n` attribute, and the group will match that of the CombinedTuning
 * that contains the resource.
 */
export default class CombinedTuningResource extends DataResource {
  private _writeBinary: boolean;

  /** 
   * Whether or not to write this combined tuning in binary DATA format.
   * 
   * NOTE: Setting this to `true` is currently unsupported. This only exists
   * so that the model doesn't have to change when it's added.
   */
  get writeBinary(): boolean { return this._writeBinary; }
  set writeBinary(value: boolean) {
    this._clearBufferCacheIfSupported();
    this._writeBinary = value;
  }

  /**
   * Creates a new CombinedTuningResource from the given XML DOM.
   * 
   * @param dom DOM to use for this Combined Tuning resource
   * @param options Object of options
   */
  constructor(
    public readonly dom: XmlDocumentNode,
    options?: CombinedTuningResourceCreationOptions
  ) {
    super(options);
    this._writeBinary = options?.writeBinary ?? false;
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

  /**
   * Combines the given tunings into one CombinedTuningResource. Note that
   * combined tuning loads in a very particular manner, so some guidelines MUST
   * be followed or you risk breaking your mod, other mods, and the game itself.
   * 
   * Before using this method and potentially setting the game on fire, please
   * review this post that explains the risks of combining tuning:
   * https://www.patreon.com/posts/72110305
   * 
   * @param tunings List of tunings to combine
   * @param group Group of tunings
   * @param refSeed Seed to use for reference IDs
   * @param options Object of options
   */
  static combine(
    tunings: XmlResource[],
    group: number,
    refSeed: bigint,
    options?: WritableModelCreationOptions
  ): CombinedTuningResource {
    return new CombinedTuningResource(
      combineTunings(tunings, group, refSeed),
      options
    );
  }

  /**
   * Combines the given tunings into one CombinedTuningResource. Note that
   * combined tuning loads in a very particular manner, so some guidelines MUST
   * be followed or you risk breaking your mod, other mods, and the game itself.
   * 
   * Before using this method and potentially setting the game on fire, please
   * review this post that explains the risks of combining tuning:
   * https://www.patreon.com/posts/72110305
   * 
   * @param tunings List of tunings to combine
   * @param group Group of tunings
   * @param refSeed Seed to use for reference IDs
   * @param options Object of options
   */
  static async combineAsync(
    tunings: XmlResource[],
    group: number,
    refSeed: bigint,
    options?: WritableModelCreationOptions
  ): Promise<CombinedTuningResource> {
    return promisify(() => CombinedTuningResource.combine(tunings, group, refSeed, options));
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

  //#region Overridden Methods

  clone(): CombinedTuningResource {
    return new CombinedTuningResource(this.dom.clone(), {
      defaultCompressionType: this.defaultCompressionType,
      initialBufferCache: this.bufferCache
    });
  }

  equals(other: CombinedTuningResource): boolean {
    if (!(other instanceof CombinedTuningResource)) return false;
    return this.dom.equals(other.dom);
  }

  isXml(): boolean {
    return !this._writeBinary;
  }

  protected _serialize(minify?: boolean): Buffer {
    return Buffer.from(this.dom.toXml({
      minify,
      writeComments: !minify,
      writeProcessingInstructions: !minify
    }));
  }

  //#endregion Overridden Methods
}

ResourceRegistry.registerTypes(
  CombinedTuningResource,
  BinaryResourceType.CombinedTuning
);
