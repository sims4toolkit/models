import Resource from './Resource';
import type { ResourceVariant } from './Resource';

/**
 * Model for resource types that are not supported by the library. This includes
 * all non-XML resources that do not have a custom model.
 */
export default class UnsupportedResource extends Resource {
  readonly variant: ResourceVariant = undefined;

  /** Reason why this resource is not supported by the library. */
  readonly reason?: string;

  private constructor(buffer: Buffer, reason?: string) {
    super(buffer);
    this.reason = reason;
  }

  /**
   * Creates a new unsupported resource from the given buffer.
   * 
   * @param buffer Buffer to create an unsupported resource from
   * @param reason Reason why this resource is unsupported
   */
  static from(buffer: Buffer, reason?: string): UnsupportedResource {
    return new UnsupportedResource(buffer, reason);
  }

  protected _serialize(): Buffer {
    throw new Error("Cannot serialize an unsupported resource.");
  }
}
