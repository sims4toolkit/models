import type { KeyStringPair, StblHeader } from "./shared";
import Resource from "../resource";
import compare from "just-compare";
import clone from "just-clone";
import CacheableModel from "../../base/cacheableModel";
import { SerializationOptions } from "../../shared";
import readStbl from "./serialization/readStbl";
import writeStbl from "./serialization/writeStbl";
import { arraysAreEqual } from "../../helpers";
import { fnv32 } from "@s4tk/hashing";
import { PrimitiveEntry, PrimitiveMappedModel } from "../../base/primitiveMappedModel";

/**
 * Model for string table resources.
 */
export default class StringTableResource extends PrimitiveMappedModel<string, StringEntry> implements Resource {
  readonly variant: 'STBL';
  private _header?: StblHeader;

  /**
   * Meta information about this string table. You probably shouldn't edit this.
   * No touchy. Hands off. Mine.
   */
  get header() { return this._header ??= {}; }
  private set header(header: StblHeader) {
    this._header = header ? this._getCollectionProxy(header) : header;
  }

  //#region Initialization

  protected constructor(header: StblHeader, entries: KeyStringPair[], buffer?: Buffer, owner?: CacheableModel) {
    super(entries, { buffer, owner });
    this.header = header;
  }

   /**
   * Creates a new StringTableResource instance from the given header and
   * entries. Both arguments are optional, and if left out, will create an empty
   * string table with default header values.
   * 
   * Arguments:
   * - `header`: Values to use in the header. Empty by default.
   * - `entries`: String entries to use. Empty by default.
   * 
   * @param args Arguments for creation
   */
  static create({ header = {}, entries = [] }: {
    header?: StblHeader;
    entries?: KeyStringPair[];
  } = {}): StringTableResource {
    return new StringTableResource(header, entries);
  }

  /**
   * Returns a new String Table that was read from the given buffer.
   * 
   * @param buffer Buffer to read as a string table
   * @param options Options to configure for reading a STBL resource
   */
  static from(buffer: Buffer, options?: SerializationOptions): StringTableResource {
    try {
      const dto = readStbl(buffer, options);
      return new StringTableResource(dto.header, dto.entries, buffer);
    } catch (e) {
      if (options !== undefined && options.dontThrow) {
        return undefined;
      } else {
        throw e;
      }
    }
  }

  //#endregion Initialization

  //#region Public Methods

  /**
   * Creates a new entry from the given string, adds it to the string table,
   * and returns it. If `toHash` is supplied, it will be hashed for the key. If
   * not, then the string itself will be hashed.
   * 
   * @param value String to add to table
   * @param toHash Optional string to hash for the key
   * @returns The entry object that was created
   */
  addAndHash(value: string, toHash?: string): StringEntry {
    const key = fnv32(toHash ? toHash : value);
    return this.add(key, value);
  }

  clone(): StringTableResource {
    const buffer = this.hasChanged ? undefined : this.buffer;
    return new StringTableResource(clone(this.header), this.entries, buffer);
  }

  equals(other: StringTableResource): boolean {
    return compare(this.header, other?.header)
      && arraysAreEqual(this.entries, other?.entries);
  }

  validate(): void {
    // TODO:
  }

  //#endregion Public Methods

  //#region Protected Methods

  protected _makeEntry(key: number, value: string): StringEntry {
    return new StringEntry(key, value, this);
  }

  protected _serialize(): Buffer {
    return writeStbl(this);
  }

  //#region Protected Methods
}

/**
 * An entry in a StringTableResource.
 */
class StringEntry extends PrimitiveEntry<string> {
  constructor(key: number, value: string, owner?: StringTableResource) {
    super(key, value, owner);
  }

  clone(): CacheableModel {
    return new StringEntry(this.key, this.value);
  }

  validate(): void {
    // TODO:
  }
}
