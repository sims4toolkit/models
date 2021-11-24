import Resource from "./resource";
import { BinaryEncoder, BinaryDecoder } from "../../utils/encoding";
import { fnv32 } from "../../utils/hashing";
import { formatStringKey } from "../../utils/formatting";

/**
 * Model for binary string table resources.
 */
export default class StringTableResource extends Resource {
  readonly variant = 'STBL';
  private _nextId: number;
  private _entries: StringEntry[];

  //#region Initialization

  private constructor(entries: KeyStringPair[], buffer?: Buffer) {
    super({ buffer });
    this._entries = entries.map((entry, id) => {
      return new StringEntry(id, entry.key, entry.string, this);
    });
    this._nextId = this._entries.length;
  }

  /**
   * Returns a new, empty String Table.
   */
  static create(): StringTableResource {
    return new StringTableResource([]);
  }

  /**
   * Returns a new String Table that was read from the given buffer.
   * 
   * @param buffer Buffer to read as a string table
   * @param options Options to configure for reading a STBL resource
   */
  static from(buffer: Buffer, options?: ReadStringTableOptions): StringTableResource {
    try {
      return new StringTableResource(readStbl(buffer, options), buffer);
    } catch (e) {
      if (options !== undefined && options.dontThrow) {
        return undefined;
      } else {
        throw e;
      }
    }
  }

  // /**
  //  * Returns a new String Table resource created from a list of entries.
  //  * 
  //  * @param json List of entries to load into the string table
  //  */
  // static fromJson(json: { key: number; string: string; }[]): StringTableResource {
  //   const stbl = StringTableResource.create();
  //   json.forEach(({ key, string }) => stbl.addEntry(key, string));
  //   return stbl;
  // }

  /**
   * Merges a variable number of string tables into one. Does not mutate the 
   * orignal STBLs, just creates a new one.
   * 
   * @param stbls String tables to merge
   */
  static merge(...stbls: StringTableResource[]): StringTableResource {
    const mergedStbl = StringTableResource.create();
    stbls.forEach(stbl => {
      stbl.entries.forEach(entry => {
        mergedStbl.add(entry.key, entry.string);
      });
    });
    return mergedStbl;
  }

  clone(): StringTableResource {
    return new StringTableResource(this.entries.map(entry => ({
      key: entry.key,
      string: entry.string
    })), this.buffer);
  }

  //#endregion Initialization

  //#region Public Methods - CREATE

  /**
   * Adds an entry to this string table.
   * 
   * Options
   * - `allowDuplicateKey`: If true, then the function will not throw when
   * adding a key that already exists. This is `false` by default.
   * 
   * @param key Key of the string to add
   * @param string String to add
   * @param options Object containing options 
   * @returns StringEntry that was added
   * @throws If the key is not 32-bit or if it already exists
   */
  add(key: number, string: string, { allowDuplicateKey = false } = {}): StringEntry {
    if (key > 0xFFFFFFFF)
      throw new Error(`Tried to add key that is > 32-bit: ${key}`);
    if (!allowDuplicateKey && this.getByKey(key))
      throw new Error(`Tried to add key that already exists: ${key}`);
    const entry = new StringEntry(this._nextId++, key, string, this);
    this.entries.push(entry);
    this.uncache();
    return entry;
  }

  /**
   * Creates the key for the given string and adds it to the string table. If
   * the key already exists, an exception will be thrown. The entry object that
   * is created will be returned.
   * 
   * Options
   * - `toHash`: If provided, this will be hashed to create the key. If not, 
   * then the string itself will be hashed.
   * - `allowDuplicateKey`: If true, then the function will not throw when
   * adding a key that already exists. This is `false` by default.
   * 
   * @param string String to add to the string table
   * @param options Object containing options 
   * @returns String entry that was added
   */
  addAndHash(string: string, { toHash, allowDuplicateKey = false }: {
    toHash?: string;
    allowDuplicateKey?: boolean;
  } = {}): StringEntry {
    return this.add(fnv32(toHash || string), string, { allowDuplicateKey });
  }

  /**
   * Adds all entries from all given string tables into this one. Entries are
   * cloned and are given new IDs relative to this table.
   * 
   * @param stbls String tables to add entries from
   */
  combine(...stbls: StringTableResource[]) {
    stbls.forEach(stbl => {
      stbl.entries.forEach(entry => {
        this.add(entry.key, entry.string);
      });
    });
  }

  //#endregion Public Methods - CREATE

  //#region Public Methods - DELETE

  /**
   * Removes any number of entries from this string table. If just removing one
   * entry, consider calling its `delete()` method.
   * 
   * @param entries Entries to remove from this string table
   */
  remove(...entries: StringEntry[]) {
    let entryRemoved = false;
    entries.forEach(entry => {
      const index = this.findIndex(entry);
      if (index < 0 || index >= this.length) return;
      this.entries.splice(index, 1);
      entryRemoved = true;
    });
    if (entryRemoved) this.uncache();
  }

  //#endregion Public Methods - DELETE

  //#region Public Methods - READ

  /**
   * All of the entries in this string table. You can mutate individual entries
   * and cacheing will be handled for you, but if you mutate the list itself
   * (e.g. by calling `push()` or `splice()`), the cache will fall out of sync
   * and you will need to call `uncache()` to reset it. To prevent cacheing
   * issues, use the built-in methods on the string table and entry objects to
   * add or remove entries.
   */
  get entries(): StringEntry[] {
    return this._entries;
  }

  /**
   * TODO:
   * 
   * @param entry TODO:
   * @returns TODO:
   */
  findIndex(entry: StringEntry): number {
    return this.entries.findIndex(e => e.id === entry.id);
  }

  /**
   * TODO:
   * 
   * @param id TODO:
   * @returns TODO:
   */
  getById(id: number): StringEntry {
    return this.entries.find(entry => entry.id === id);
  }

  /**
   * TODO:
   * 
   * @param key TODO:
   * @returns TODO:
   */
  getByKey(key: number): StringEntry {
    return this.entries.find(entry => entry.key === key);
  }

  /** The number of entries in this string table. */
  get length(): number {
    return this.entries.length;
  }

  /**
  * Returns all entries that contain the given string following the given
  * options. All options are false by default, so if no options are passed,
  * the search will be for a case-insensitive exact match.
  * 
  * Do not mutate the objects that are output. Doing so will break things.
  * 
  * @param string String to search for
  */
  search(string: string, options?: StringSearchOptions): StringEntry[] {
    const checkCase = options !== undefined && options.caseSensitive;
    const checkSubstrings = options !== undefined && options.includeSubstrings;

    return this.entries.filter(entry => {
      if (checkSubstrings) {
        // substring
        return checkCase ?
          entry.string.includes(string) :
          entry.string.toLowerCase().includes(string.toLowerCase());
      } else {
        // exact match
        return checkCase ?
          entry.string === string :
          entry.string.toLowerCase() === string.toLowerCase();
      }
    });
  }

  /**
   * Finds and returns any errors that are in this string table. Returns an
   * empty array if there are no errors.
   */
  findErrors(): { error: StringTableError; entries: StringEntry[]; }[] {
    const keyMap: { [key: number]: StringEntry[] } = {};
    const stringMap: { [key: string]: StringEntry[] } = {};

    this.entries.forEach(entry => {
      if (keyMap[entry.key] === undefined) keyMap[entry.key] = [];
      keyMap[entry.key].push(entry);
      if (stringMap[entry.string] === undefined) stringMap[entry.string] = [];
      stringMap[entry.string].push(entry);
    });

    const result: { error: StringTableError; entries: StringEntry[]; }[] = [];
    for (const key in keyMap) {
      if (keyMap[key].length > 1)
        result.push({ error: 'Duplicate Keys', entries: keyMap[key] });
    }
    for (const string in stringMap) {
      if (stringMap[string].length > 1)
        result.push({ error: 'Duplicate Strings', entries: stringMap[string] });
      if (string === '')
        result.push({ error: 'Empty String', entries: stringMap[string] });
    }
    return result;
  }

  //#endregion Public Methods - READ

  //#region Protected Methods

  protected _serialize(): Buffer {
    return writeStbl(this._entries);
  }

  //#endregion Protected Methods
}

/**
 * An entry in a StringTableResource.
 */
class StringEntry {
  readonly id: number;
  private _key: number;
  private _string: string;
  private _stbl: StringTableResource;

  constructor(id: number, key: number, string: string, stbl: StringTableResource) {
    this.id = id;
    this._key = key;
    this._string = string;
    this._stbl = stbl;
    stbl.uncache();
  }

  /** Removes this entry from the STBL that owns it. */
  delete() {
    this._stbl.remove(this);
  }

  /** Gets the key of this entry. */
  get key(): number {
    return this._key;
  }

  /** Sets the key of this entry and uncaches the STBL that owns it. */
  set key(key: number) {
    this._key = key;
    this._stbl.uncache();
  }

  /** Gets the string of this entry. */
  get string(): string {
    return this._string;
  }

  /** Sets the string of this entry and uncaches the STBL that owns it. */
  set string(string: string) {
    this._string = string;
    this._stbl.uncache();
  }
}

//#region Interfaces & Types

type StringTableError = 'Duplicate Keys' | 'Duplicate Strings' | 'Empty String';

interface StringSearchOptions {
  caseSensitive?: boolean;
  includeSubstrings?: boolean;
}

interface KeyStringPair {
  key: number;
  string: string;
}

interface ReadStringTableOptions {
  ignoreErrors: boolean;
  dontThrow: boolean;
}

//#endregion Interfaces & Types

//#region Serialization

/**
 * Reads STBL content from the given buffer.
 * 
 * @param buffer Buffer to read as a STBL
 * @param options Options to configure
 */
function readStbl(buffer: Buffer, options?: ReadStringTableOptions): KeyStringPair[] {
  const decoder = new BinaryDecoder(buffer);

  if (options === undefined || !options.ignoreErrors) {
    // mnFileIdentifier
    if (decoder.charsUtf8(4) !== "STBL")
      throw new Error("Not a string table.");

    // mnVersion
    if (decoder.uint16() !== 5)
      throw new Error("Version must be 5.");
  } else {
    decoder.skip(6);
  }
  
  decoder.skip(1); // mnCompressed (uint8; has no use, will never be set)
  const mnNumEntries = decoder.uint64();
  decoder.skip(6); // mReserved (2 bytes) + mnStringLength (uint32; 4 bytes)

  const entries: KeyStringPair[] = [];
  for (let id = 0; id < mnNumEntries; id++) {
    const key = decoder.uint32();
    decoder.skip(1); // mnFlags (uint8; has no use, will never be set)
    const stringLength = decoder.uint16();
    const string = stringLength > 0 ? decoder.charsUtf8(stringLength) : '';
    entries.push({ key, string });
  }

  return entries;
}

/**
 * Writes STBL content to a buffer.
 * 
 * @param entries STBL entries to serialize
 */
function writeStbl(entries: KeyStringPair[]): Buffer {
  let totalBytes = 21; // num bytes in header
  let totalStringLength = 0;
  const stringLengths: number[] = [];
  entries.forEach(entry => {
    const stringLength = Buffer.byteLength(entry.string);
    stringLengths.push(stringLength);
    totalStringLength += stringLength + 1;
    totalBytes += stringLength + 7;
  });

  const buffer = Buffer.alloc(totalBytes);
  const encoder = new BinaryEncoder(buffer);

  encoder.charsUtf8('STBL'); // mnFileIdentifier
  encoder.uint16(5); // mnVersion
  encoder.skip(1); // mnCompressed (should be null)
  encoder.uint64(entries.length); // mnNumEntries
  encoder.skip(2); // mReserved (should be null)
  encoder.uint32(totalStringLength); // mnStringLength
  entries.forEach((entry, index) => {
    encoder.uint32(entry.key);
    encoder.skip(1); // mnFlags (should be null)
    encoder.uint16(stringLengths[index]);
    encoder.charsUtf8(entry.string);
  });

  return buffer;
}

//#endregion Serialization
