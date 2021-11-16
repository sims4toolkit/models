import { ResourceBase } from './ResourceBase';
import type { ResourceVariant } from './ResourceBase';

/**
 * Model for unsupported resource types.
 */
export default class UnsupportedResource extends ResourceBase {
  readonly variant: ResourceVariant = undefined;

  private constructor(buffer?: Buffer) {
    super(buffer);
  }

  static from(buffer: Buffer): UnsupportedResource {
    return new UnsupportedResource(buffer);
  }

  serialize(): Buffer {
    throw new Error("Cannot serialize an unsupported resource.");
  }
}
