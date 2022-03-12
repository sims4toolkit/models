import type Resource from '../resource';
import WritableModel, { WritableModelConstArgs } from '../../base/writable-model';
import EncodingType from '../../enums/encoding-type';
import { bufferContainsXml } from '../../common/helpers';
import { CompressionType } from '@s4tk/compression';

//#region Types

/**
 * Additional arguments specific to raw resources.
 */
type RawResourceAdditionalArgs = Partial<{
  /** Reason why this resource is not being parsed. */
  reason?: string;
}>;

/** Arguments for `RawResource`'s constructor. */
interface RawResourcsConstArgs extends Omit<WritableModelConstArgs, "saveBuffer">, RawResourceAdditionalArgs { };

/** Arguments for `RawResource.from()`. */
interface RawResourceFromOptions extends Omit<RawResourcsConstArgs, "buffer"> { };

//#endregion Types

//#region Classes

/**
 * Model for resources that have not been parsed and cannot be modified.
 */
export default class RawResource extends WritableModel implements Resource {
  readonly encodingType: EncodingType = EncodingType.Unknown;
  readonly reason?: string;

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

  protected constructor(args: RawResourcsConstArgs) {
    super(args);
    this.reason = args.reason;
  }

  /**
   * Creates a new RawResource from the given buffer.
   * 
   * @param buffer Buffer for raw resource
   * @param options Optional arguments
   */
  static from(buffer: Buffer, options: RawResourceFromOptions = {}): RawResource {
    return new RawResource(Object.assign({ buffer, saveBuffer: true }, options));
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): RawResource {
    // TODO: option to clone buffer?
    return new RawResource(this);
  }

  equals(other: RawResource): boolean {
    return other && (this.buffer.compare(other.buffer) === 0);
  }

  isXml(): boolean {
    return bufferContainsXml(this.buffer);
  }

  onChange() {
    // intentionally blank
  }

  //#endregion Public Methods

  //#region Protected Methods

  protected _deleteBufferIfSupported(): void {
    // intentionally blank
  }

  protected _serialize(): Buffer {
    throw new Error("Cannot serialize a raw resource. If you're reading this error, you somehow deleted the cached buffer from a raw resource. This should be impossible to do, so please report this error to me ASAP: https://github.com/sims4toolkit/models/issues");
  }

  //#endregion Protected Methods
}
