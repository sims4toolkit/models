import type Resource from '../resource';
import WritableModel, { WritableModelConstructorArguments } from '../../base/writable-model';
import EncodingType from '../../enums/encoding-type';
import { bufferContainsXml } from '../../common/helpers';
import { CompressionType } from '@s4tk/compression';

/** Additional arguments specific to Raw resources. */
type RawResourceAdditionalArguments = Partial<{
  /** Why this resource is loaded raw. Used for debugging. */
  reason?: string;
}>;

/** Arguments for `RawResource`'s constructor. */
interface RawResourceConstructorArguments extends WritableModelConstructorArguments, RawResourceAdditionalArguments { };

/**
 * Model for resources that have not been parsed and cannot be modified.
 */
export default class RawResource extends WritableModel implements Resource {
  readonly encodingType: EncodingType = EncodingType.Unknown;
  readonly reason?: string;

  /** Alias for getBuffer(), since the buffer will never change. */
  get buffer(): Buffer { return this.getBuffer(); }

  //#region Initialization

  constructor(args: RawResourceConstructorArguments) {
    super(args);
    this.reason = args.reason;
  }

  // FIXME: guarantee that a buffer is passed, and add a from() method? if adding from(), remove that line from changlog

  //#endregion Initialization

  //#region Public Methods

  clone(): RawResource {
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

  protected _clearBufferCacheIfSupported(): void {
    // intentionally blank
  }

  protected _serialize(): Buffer {
    throw new Error("Cannot serialize a raw resource. If you're reading this error, the cached buffer in a raw resource somehow got deleted, which should be impossible. Please report this error ASAP: https://github.com/sims4toolkit/models/issues");
  }

  //#endregion Protected Methods
}
