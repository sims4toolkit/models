import Resource from "./Resource";
import type { ResourceVariant } from "./Resource";

const DEFAULT_CONTENT = `<?xml version="1.0" encoding="utf-8"?>\n<I c="" i="" m="" n="" s="">\n  \n</I>`;

/**
 * A resource that contains plaintext XML.
 */
export default class TuningResource extends Resource {
  readonly variant: ResourceVariant = 'XML';
  private _content: string;
  private _attrs: {
    n?: string; // file name
    c?: string; // class name
    i?: string; // type name
    m?: string; // module path
    s?: string; // decimal tuning id
  };

  //#region Initialization

  /**
   * Constructor. This should NOT be used by external code. Please use the
   * static `create()` and `from()` methods to create new instances.
   * 
   * @param content The XML content of this resource
   * @param cachedBuffer The pre-serialized buffer for this resource
   */
  private constructor(content: string, cachedBuffer?: Buffer) {
    super(cachedBuffer);
    this._content = content;
    this._attrs = {};
  }

  clone(): TuningResource {
    return new TuningResource(this._content);
  }

  /**
   * Creates a new tuning resource. It will come with boilerplate XML unless 
   * `blank` is set to `true`.
   * 
   * @param blank Whether or not the tuning file should be empty
   */
  static create(blank?: boolean): TuningResource {
    return new TuningResource(blank ? '' : DEFAULT_CONTENT);
  }

  /**
   * Creates a tuning resource from a buffer containing XML code that is encoded
   * with the given encoding. If no encoding is given, it will be read as UTF-8.
   * 
   * @param buffer Buffer to create a tuning resource from
   * @param encoding How the buffer is encoded (UTF-8 by default)
   */
  static from(buffer: Buffer, encoding: BufferEncoding = 'utf-8'): TuningResource {
    return new TuningResource(buffer.toString(encoding), buffer);
  }

  //#endregion Initialization

  //#region Public Methods

  /**
   * Returns the content of this tuning resource.
   */
  getContent(): string {
    return this._content;
  }

  /**
   * Updates the content of this resource to a new string containing XML.
   * 
   * @param content New content of this resource
   */
  updateContent(content: string) {
    this._content = content;
    this._uncache();
  }

  /**
   * Returns the filename in the `n` attribute. If there is no name, `undefined`
   * will be returned.
   */
  getFileName(): string {
    return this._getAttr('n');
  }

  /**
   * Updates the filename in the `n` attribute.
   * 
   * @param value New filename to use
   */
  updateFileName(value: string) {
    this._updateAttr('n', value);
  }

  /**
   * Returns the class name in the `c` attribute. If there is no class,
   * `undefined` will be returned.
   */
  getClassName(): string {
    return this._getAttr('c');
  }

  /**
   * Returns the type name in the `i` attribute. If there is no type name,
   * `undefined` will be returned.
   */
  getTypeName(): string {
    return this._getAttr('i');
  }

  /**
   * Returns the module path in the `m` attribute. If there is no module path,
   * undefined will be returned.
   */
  getModulePath(): string {
    return this._getAttr('m');
  }

  /**
   * Returns the tuning ID in the `s` attribute. If there is no tuning ID,
   * then `undefined` is returned. Note that the tuning ID will be returned as
   * a decimal number in a string, as may not be equal to the instance ID in
   * this resource's record.
   */
  getTuningId(): string {
    return this._getAttr('s');
  }

  /**
   * Updates the tuning ID in the `s` attribute.
   * 
   * @param value New tuning ID to use
   */
  updateTuningId(value: string) {
    this._updateAttr('s', value);
  }

  //#endregion Public Methods

  //#region Protected Methods

  protected _serialize(): Buffer {
    return Buffer.from(this._content, 'utf-8');
  }

  protected _uncache() {
    super._uncache();
    this._attrs = {};
  }

  //#endregion Protected Methods

  //#region Private Methods

  /**
   * Returns the value of the given attribute.
   * 
   * @param attr Name of attribute to get
   */
  private _getAttr(attr: string): string {
    if (this._attrs[attr] === undefined)
      this._attrs[attr] = this._getAttrValue(attr);
    return this._attrs[attr];
  }

  /**
   * Finds and returns the value of the given attribute.
   * 
   * @param attr Name of attribute to get
   */
  private _getAttrValue(attr: string): string {
    // Yes, I am aware of how ugly this code is. But, it is way more efficient
    // than parsing the entire file as XML or using a regex. These attributes
    // are usually in the second line of the file, and this method will short
    // circuit as soon as they are found.

    try {
      return this._content.split(`${attr}="`)[1].split('"')[0];
    } catch (e) {
      return undefined;
    }
  }

  /**
   * Updates the value of an attribute.
   * 
   * @param attr Name of attribute to update
   * @param value New value of attribute
   */
  private _updateAttr(attr: string, value: string) {
    try {
      const [before, mid] = this._content.split(`${attr}="`);
      const after = mid.split('"')[1];
      this._content = `${before}"${value}"${after}`;
      this._uncache();
      this._attrs[attr] = value;
    } catch (e) {
      throw new Error(`Cannot update "${attr}" attribute: ${e}`);
    }
  }

  //#endregion Private Methods
}
