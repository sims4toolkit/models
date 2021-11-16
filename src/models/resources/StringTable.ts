import { ResourceBase, ResourceVariant } from "./ResourceBase";

export default class StringTableResource extends ResourceBase {
  readonly variant: ResourceVariant = 'STBL';

  private constructor(cachedBuffer?: Buffer) {
    super(cachedBuffer);
  }

  static from(buffer: Buffer): StringTableResource {
    return new StringTableResource(buffer); // TODO: impl
  }

  protected serialize(): Buffer {
    return undefined; // TODO: impl
  }
}
