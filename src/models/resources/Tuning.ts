import { ResourceBase, ResourceVariant } from "./Resource";

const DEFAULT_CONTENT = `<?xml version="1.0" encoding="utf-8"?>\n<I c="" i="" m="" n="" s="">\n  \n</I>`;

export default class TuningResource extends ResourceBase {
  readonly variant: ResourceVariant = 'XML';
  private _contents: string;

  private constructor(contents: string, cachedBuffer?: Buffer) {
    super(cachedBuffer);
    this._contents = contents;
  }

  static create(): TuningResource {
    return new TuningResource(DEFAULT_CONTENT);
  }

  static from(buffer: Buffer): TuningResource {
    return new TuningResource(buffer.toString('utf-8'), buffer);
  }

  protected serialize(): Buffer {
    return Buffer.from(this._contents, 'utf-8');
  }

  update(contents: string) {
    this._contents = contents;
    this.uncache();
  }
}
