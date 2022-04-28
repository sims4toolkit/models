import type Resource from '../resource';
import WritableModel from '../../base/writable-model';
import EncodingType from '../../enums/encoding-type';
import { bufferContainsXml } from '../../common/helpers';

/**
 * Model for resources that consist of just a buffer and cannot be modified.
 */
export default abstract class StaticResource extends WritableModel implements Resource {
  abstract readonly encodingType: EncodingType;

  /** Shorthand for `this.getBuffer()`, since the buffer will never change. */
  get buffer(): Buffer { return this.getBuffer(); }

  abstract clone(): StaticResource;

  equals(other: WritableModel): boolean {
    const otherBuffer = other?.getBuffer?.();
    return Boolean(otherBuffer)
      && (this.buffer.byteLength === otherBuffer.byteLength)
      && (this.buffer.compare(otherBuffer) === 0);
  }

  isXml(): boolean {
    return bufferContainsXml(this.buffer);
  }

  onChange() {
    // intentionally blank
  }

  protected _clearBufferCacheIfSupported(): void {
    // intentionally blank
  }

  protected _serialize(): Buffer {
    throw new Error("Cannot serialize a static resource. If you're reading this error, the cached buffer in a static resource somehow got deleted, which should be impossible. Please report this error ASAP: https://github.com/sims4toolkit/models/issues");
  }
}
