import Resource from "./Resource";
import type { ResourceVariant } from "./Resource";

/**
 * A resource that contains binary tuning (SimData).
 */
export default class SimDataResource extends Resource {
  readonly variant: ResourceVariant = 'DATA';

  private constructor(cachedBuffer?: Buffer) {
    super(cachedBuffer);
  }

  static from(buffer: Buffer): SimDataResource {
    return 
  }

  protected _serialize(): Buffer {
    return undefined; // TODO: impl
  }
}
