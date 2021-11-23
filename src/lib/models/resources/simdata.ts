import Resource from "./resource";

/**
 * A resource that contains binary tuning (SimData).
 */
export default class SimDataResource extends Resource {
  readonly variant = 'DATA';

  private constructor(cachedBuffer?: Buffer) {
    super(cachedBuffer);
  }

  clone(): SimDataResource {
    return undefined;
  }

  static from(buffer: Buffer): SimDataResource {
    return 
  }

  protected _serialize(): Buffer {
    return undefined; // TODO: impl
  }
}
