import type Resource from '../resource';
import WritableModel from '../../base/writable-model';
import EncodingType from '../../enums/encoding-type';
import { bufferContainsXml } from '../../common/helpers';

/**
 * Model for resources that have not been parsed.
 */
export default class RawResource extends WritableModel implements Resource {
  readonly encodingType: EncodingType = EncodingType.Unknown;
  // NOTE: If necessary, cache plainText. For now, the memory overhead doesn't
  // seem worth it.

  /**
   * The contents of this resource as plain text.
   */
   get plainText(): string {
    return this.buffer.toString('utf-8');
  }

  //#region Initialization

  protected constructor(buffer: Buffer, public reason?: string) {
    super(buffer);
  }

  /**
   * Creates a new RawResource from the given buffer.
   * 
   * @param buffer Buffer to create a raw resource from
   */
  static from(buffer: Buffer, reason?: string): RawResource {
    return new RawResource(buffer, reason);
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): RawResource {
    return RawResource.from(this.buffer, this.reason);
  }

  equals(other: RawResource): boolean {
    return other && (this.buffer.compare(other.buffer) === 0);
  }

  isXml(): boolean {
    return bufferContainsXml(this.buffer);
  }

  onChange() {
    // intentionally blank because the buffer cannot be deleted -- it is the
    // only defining feature of this model
  }

  //#endregion Public Methods

  //#region Protected Methods

  protected _serialize(): Buffer {
    // this should never be thrown in prod, just for development
    throw new Error("Cannot serialize a raw resource.");
  }

  //#endregion Protected Methods
}
