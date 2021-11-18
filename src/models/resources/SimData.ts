import { ResourceBase, ResourceVariant } from "./Resource";

export default class SimDataResource extends ResourceBase {
  readonly variant: ResourceVariant = 'DATA';

  private constructor(cachedBuffer?: Buffer) {
    super(cachedBuffer);
  }

  static from(buffer: Buffer): SimDataResource {
    return 
  }

  protected serialize(): Buffer {
    return undefined; // TODO: impl
  }
}
