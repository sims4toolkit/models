import type Resource from '../resource';
import WritableModel from '../../base/writable-model';
import EncodingType from '../../enums/encoding-type';
import { bufferContainsXml } from '../../common/helpers';

/**
 * Model for resources that have not been parsed.
 */
export default class RawResource extends WritableModel implements Resource {
  readonly encodingType: EncodingType = EncodingType.Unknown;

  /**
   * The contents of this resource as plain text.
   */
  get plainText(): string {
    return this.buffer.toString('utf-8');
  }

  get saveBuffer() { return true; }
  set saveBuffer(saveBuffer: boolean) {
    // intentionally blank -- raw resource must always have its buffer saved
  }

  //#region Initialization

  protected constructor(buffer: Buffer, public reason?: string) {
    super(true, buffer); // raw resource must always save its buffer
  }

  /**
   * Creates a new RawResource from the given buffer.
   * 
   * @param buffer Buffer to create a raw resource from
   * @param reason Optional reason why this resource is not being parsed
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
