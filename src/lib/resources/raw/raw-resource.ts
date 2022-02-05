import type Resource from '../resource';
import WritableModel from '../../base/writable-model';
import EncodingType from '../../enums/encoding-type';
import { bufferContainsXml } from '../../common/helpers';
import CompressionType from '../../compression/compression-type';

/**
 * Model for resources that have not been parsed.
 */
export default class RawResource extends WritableModel implements Resource {
  readonly encodingType: EncodingType = EncodingType.Unknown;

  /** The contents of this resource as plain text. */
  get plainText(): string { return this.buffer.toString('utf-8'); }

  get saveBuffer() { return true; }
  set saveBuffer(saveBuffer: boolean) {
    // intentionally blank -- raw resource must always have its buffer saved
  }

  //#region Initialization

  protected constructor(
    buffer: Buffer,
    readonly compressionType: CompressionType,
    readonly isCompressed: boolean,
    readonly sizeDecompressed?: number,
    public reason?: string,
  ) {
    super(true, buffer); // raw resource must always save its buffer
  }

  /**
   * Creates a new RawResource.
   * 
   * Options
   * - `compressionType`: How this resource is/should be compressed. ZLIB by
   * default.
   * - `isCompressed`: Whether or not the buffer in this raw resource is
   * compressed using the algorithm specified in `compressionType`. False by
   * default.
   * - `sizeDecompressed`: The length of the buffer when it is decompressed.
   * Equals the length of the given buffer by default.
   * - `reason`: Reason why this resource is being loaded raw.
   * 
   * @param buffer Buffer for raw resource
   * @param options Optional arguments
   */
  static from(buffer: Buffer, { compressionType, isCompressed, sizeDecompressed, reason }: {
    compressionType?: CompressionType;
    isCompressed?: boolean;
    sizeDecompressed?: number;
    reason?: string;
  } = {}): RawResource {
    return new RawResource(
      buffer,
      compressionType ?? CompressionType.ZLIB,
      isCompressed ?? false,
      sizeDecompressed ?? buffer.length,
      reason
    );
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): RawResource {
    return new RawResource(
      this.buffer,
      this.compressionType,
      this.isCompressed,
      this.sizeDecompressed,
      this.reason
    );
  }

  equals(other: RawResource): boolean {
    return other && (this.buffer.compare(other.buffer) === 0);
  }

  isXml(): boolean {
    return bufferContainsXml(this.buffer);
  }

  onChange() {
    // intentionally blank because this model cannot be changed, and its buffer
    // cannot be deleted -- it is the only defining feature of this model
    return;
  }

  //#endregion Public Methods

  //#region Protected Methods

  protected _serialize(): Buffer {
    // this should never be thrown in prod, just for development
    throw new Error("Cannot serialize a raw resource.");
  }

  //#endregion Protected Methods
}
