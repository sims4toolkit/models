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
    public reason?: string
  ) {
    super(true, buffer); // raw resource must always save its buffer
  }

  /**
   * Creates a new RawResource.
   * 
   * @param buffer Buffer for raw resource
   * @param compressionType How this resource is/should be compressed
   * @param isCompressed Whether or not the buffer is already compressed
   * @param reason Why this resource is raw
   */
  static from(
    buffer: Buffer,
    compressionType: CompressionType,
    isCompressed: boolean,
    reason?: string
  ): RawResource {
    return new RawResource(buffer, compressionType, isCompressed, reason);
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): RawResource {
    return new RawResource(
      this.buffer,
      this.compressionType,
      this.isCompressed,
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
