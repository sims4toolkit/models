import type { KeyStringPair } from "./shared";
import { fnv32 } from "@s4tk/hashing";
import ApiModelBase from "../../base/api-model";
import { PrimitiveEntry, PrimitiveMappedModel } from "../../base/primitive-mapped-model";
import Resource from "../resource";
import { arraysAreEqual } from "../../common/helpers";
import { FileReadingOptions } from "../../common/options";
import readStbl from "./serialization/read-stbl";
import writeStbl from "./serialization/write-stbl";
import EncodingType from "../../enums/encoding-type";

/**
 * Model for string table (STBL) resources.
 */
export default class StringTableResource extends PrimitiveMappedModel<string, StringEntry> implements Resource {
  readonly encodingType: EncodingType = EncodingType.STBL;

  //#region Initialization

  protected constructor(
    entries?: KeyStringPair[],
    buffer?: Buffer,
    saveBuffer?: boolean
  ) {
    super(entries, buffer, saveBuffer);
  }

   /**
   * Creates a new StringTableResource instance with the given entries, if any.
   * If no entries are provided, an empty STBL is created.
   * 
   * @param entries Optional entries to create STBL with
   */
  static create({ entries, saveBuffer }: {
    entries?: KeyStringPair[];
    saveBuffer?: boolean;
  } = {}): StringTableResource { 
    return new StringTableResource(entries, undefined, saveBuffer);
  }

  /**
   * Reads the given buffer as a StringTableResource instance and returns it.
   * 
   * @param buffer Buffer to read as a string table
   * @param options Options to configure for reading a STBL resource
   */
  static from(buffer: Buffer, options?: FileReadingOptions): StringTableResource {
    return new StringTableResource(readStbl(buffer, options), buffer, options?.saveBuffer);
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
    const buffer = this.isCached ? this.buffer : undefined;
    return new StringTableResource(this.entries, buffer);
  }

  equals(other: StringTableResource): boolean {
    return arraysAreEqual(this.entries, other?.entries);
  }

  isXml(): boolean {
    return false;
  }

  //#endregion Public Methods

  //#region Protected Methods

  protected _makeEntry(key: number, value: string): StringEntry {
    return new StringEntry(key, value, this);
  }

  protected _serialize(): Buffer {
    return writeStbl(this.entries);
  }

  //#region Protected Methods
}

/**
 * An entry in a StringTableResource.
 */
class StringEntry extends PrimitiveEntry<string> {
  /** Alias for `this.value` for readability. */
  get string(): string { return this.value; }
  set string(string: string) {
    this.value = string;
    this.onChange();
  }

  constructor(key: number, value: string, owner?: StringTableResource) {
    super(key, value, owner);
  }

  clone(): StringEntry {
    return new StringEntry(this.key, this.value);
  }

  validate(): void {
    if (Number.isNaN(this.key) || this.key < 0 || this.key > 0xFFFFFFFF)
      throw new Error(`Expected string entry's key to be a UInt32, got ${this.key}`);
  }
}
