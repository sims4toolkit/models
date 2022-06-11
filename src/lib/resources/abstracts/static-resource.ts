import { CompressedBuffer } from '@s4tk/compression';
import type Resource from '../resource';
import WritableModel from '../../base/writable-model';
import EncodingType from '../../enums/encoding-type';
import { bufferContainsXml } from '../../common/helpers';

/**
 * Model for resources that do not have an interface to be edited, and can only
 * be modifed by replacing its buffer in its entirety.
 */
export default abstract class StaticResource extends WritableModel implements Resource {
  abstract readonly encodingType: EncodingType;

  /** Shorthand for `this.getBuffer()`. */
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

  /**
   * Replaces the actual content data in this resource with that in the given
   * compressed buffer wrapper. This function should be used with care, as there
   * are no safeguards in place to prevent the model from becoming corrupt.
   * 
   * @param content Compressed buffer wrapper to replace the cache with
   */
  replaceContent(content: CompressedBuffer) {
    this._bufferCache = content;
    this.owner?.onChange();
  }

  protected _clearBufferCacheIfSupported(): void {
    // intentionally blank
  }

  protected _serialize(): Buffer {
    throw new Error("Cannot serialize a static resource. If you're reading this error, the cached buffer in a static resource somehow got deleted, which should be impossible. Please report this error ASAP: https://github.com/sims4toolkit/models/issues");
  }
}
