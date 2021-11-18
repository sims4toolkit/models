import Resource from './Resource';

/**
 * Model for unsupported resource types.
 */
export default class UnsupportedResource extends Resource {
  readonly variant: ResourceVariant = undefined;
  readonly reason?: string;

  private constructor(buffer?: Buffer, reason?: string) {
    super(buffer);
    this.reason = reason;
  }

  static from(buffer: Buffer, reason?: string): UnsupportedResource {
    return new UnsupportedResource(buffer, reason);
  }

  protected serialize(): Buffer {
    throw new Error("Cannot serialize an unsupported resource.");
  }
}
