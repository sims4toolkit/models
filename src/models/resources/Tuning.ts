import type { ResourceType } from "../../types/DBPF";


export default class TuningResource extends ResourceBase {
  renderType: RecordType = 'XML';
  displayName: string; // FIXME: make this the n= in the file
  private _contents: string;

  private constructor(contents: string, cachedBuffer?: Buffer) {
    super(cachedBuffer);
    this._contents = contents;
    try {
      this.displayName = contents.split('<', 3)[2].split('n="', 2)[1].split('"', 1)[0];
    } catch {
      this.displayName = "Tuning";
    }
  }

  //#region Static Methods

  /**
   * Creates and returns a new Tuning model.
   * 
   * @returns A new, empty Tuning model
   */
  public static create(): Tuning {
    return new Tuning(defaultTuningContents())
  }

  /**
   * Creates a new Tuning model from the given buffer.
   * 
   * @param buffer The buffer to read as a Tuning
   * @returns A new Tuning that is read from the given buffer
   */
  public static from(buffer: Buffer): Tuning {
    return new Tuning (buffer.toString('utf-8'), buffer);
  }

  //#endregion Static Methods

  //#region Methods

  renderData(): any {
    return this._contents;
  }

  protected serialize(): Buffer {
    return Buffer.from(this._contents, 'utf-8');
  }

  update(contents: string) {
    this._contents = contents;
    this.onChange();
  }

  //#endregion Methods
}

/**
 * Returns the default contents of a tuning file.
 * 
 * @returns The default contents of a tuning file
 */
function defaultTuningContents(): string {
  return `<?xml version="1.0" encoding="utf-8"?>\n<I c="" i="" m="" n="" s="">\n  \n</I>`;
}
