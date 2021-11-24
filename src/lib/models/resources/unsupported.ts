import Resource from './resource';

/**
 * Model for resources that are not supported by S4TK.
 */
export default class UnsupportedResource extends Resource {
  readonly variant = undefined;

  /** Reason why this resource is not supported. */
  readonly reason?: string;

  private constructor(buffer: Buffer, reason?: string) {
    super({buffer});
    this.reason = reason;
  }

  clone(): UnsupportedResource {
    return UnsupportedResource.from(this.buffer);
  }

  /**
   * Creates a new unsupported resource from the given buffer. This is
   * functionally the same as the constructor, but is provided for parity with
   * the other resource types.
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
