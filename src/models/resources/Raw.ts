import Resource from './Resource';
import type { ResourceVariant } from './Resource';

/**
 * Model for resource types that may or may not be supported, but have
 * intentionally not been parsed any further than their raw buffer.
 */
export default class RawResource extends Resource {
  readonly variant: ResourceVariant = 'RAW';

  private constructor(buffer: Buffer) {
    super(buffer);
  }

  /**
   * Creates a new raw resource from the given buffer.
   * 
   * @param buffer Buffer to create a raw resource from
   */
  static from(buffer: Buffer): RawResource {
    return new RawResource(buffer);
  }

  protected _serialize(): Buffer {
    throw new Error("Cannot serialize a raw resource.");
  }
}
