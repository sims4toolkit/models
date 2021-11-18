import Resource from "./Resource";
import type { ResourceVariant } from "./Resource";

/**
 * A resource that contains string table data.
 */
export default class StringTableResource extends Resource {
  readonly variant: ResourceVariant = 'STBL';

  private constructor(cachedBuffer?: Buffer) {
    super(cachedBuffer);
  }

  static from(buffer: Buffer): StringTableResource {
    return new StringTableResource(buffer); // TODO: impl
  }

  protected _serialize(): Buffer {
    return undefined; // TODO: impl
  }
}
