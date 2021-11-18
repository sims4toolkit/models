import Resource from './Resource';

/**
 * Model for resource types that could be supported, but are not fully loaded.
 */
export default class RawResource extends Resource {
  readonly variant = 'RAW';

  private constructor(buffer?: Buffer) {
    super(buffer);
  }

  static from(buffer: Buffer): RawResource {
    return new RawResource(buffer);
  }

  protected _serialize(): Buffer {
    throw new Error("Cannot serialize a raw resource.");
  }
}
