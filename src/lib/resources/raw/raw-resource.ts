import type Resource from '../resource';
import WritableModel from '../../base/writable-model';
import EncodingType from '../../enums/encoding-type';
import { bufferContainsXml } from '../../common/helpers';
import { CompressionType } from '@s4tk/compression';

/**
 * Model for resources that have not been parsed. These models are immutable;
 * nothing on them can be changed, including how the buffer is compressed.
 */
export default class RawResource extends WritableModel implements Resource {
  readonly encodingType: EncodingType = EncodingType.Unknown;

  /** The contents of this resource as plain text. */
  get plainText(): string { return this.buffer.toString('utf-8'); }

  // FIXME: does super function how I think it does here?
  get compressBuffer() { return super.compressBuffer; }
  set compressBuffer(value: boolean) {
    // FIXME: might throw an error somewhere unexpected, may need to be blank
    throw new Error("Cannot change value of compressBuffer on RawResource. You must clone this resource and change the value during initialization.");
  }

  get compressionType() { return super.compressionType; }
  set compressionType(value: CompressionType) {
    // FIXME: might throw an error somewhere unexpected, may need to be blank
    throw new Error("Cannot change value of compressionType on RawResource. You must clone this resource and change the value during initialization.");
  }

  get saveBuffer() { return super.saveBuffer; }
  set saveBuffer(value: boolean) {
    // FIXME: might throw an error somewhere unexpected, may need to be blank
    throw new Error("Cannot change value of saveBuffer on RawResource. It must always be true.");
  }

  //#region Initialization

  protected constructor(
    compressBuffer: boolean,
    compressionType: CompressionType,
    buffer: Buffer,
    sizeDecompressed: number,
    public reason?: string,
  ) {
    // raw resource must always save its buffer
    super(true, compressBuffer, compressionType, buffer, sizeDecompressed);
  }

  /**
   * Creates a new RawResource from the given buffer.
   * 
   * Options
   * - `compressionType`: How this resource is/should be compressed. Even if the
   * buffer itself is not compressed, this will dictate how to compress this
   * resource when written to a package. ZLIB by default.
   * - `isCompressed`: Whether or not the provided buffer is compressed using
   * the algorithm specified by `compressionType`. False by default.
   * - `sizeDecompressed`: The byte length of the buffer when decompressed.
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
      isCompressed ?? false,
      compressionType ?? CompressionType.ZLIB,
      buffer,
      sizeDecompressed ?? buffer.byteLength,
      reason
    );
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): RawResource {
    return new RawResource(
      this.isCompressed,
      this.compressionType,
      this.buffer,
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
    throw new Error("Cannot serialize a raw resource. If you're reading this error, you somehow deleted the cached buffer from a raw resource. This should be impossible to do, so please report this error to me ASAP: https://github.com/sims4toolkit/models/issues");
  }

  //#endregion Protected Methods
}
