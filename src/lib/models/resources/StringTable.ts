import Resource from "./Resource";
import type { ResourceVariant } from "./Resource";
import { BinaryEncoder, BinaryDecoder } from "../../utils/encoding";
import { fnv32 } from "../../utils/hashing";

/**
 * A resource that contains string table data.
 */
export default class StringTableResource extends Resource {
  readonly variant: ResourceVariant = 'STBL';
  private _stblContent: StringTableContent;

  //#region Initialization

  /**
   * Constructor. This should NOT be used by external code. Please use the
   * static `create()` and `from()` methods to create new instances.
   * 
   * @param content The content of this STBL
   * @param cachedBuffer The pre-serialized buffer for this STBL
   */
  private constructor(content: StringTableContent, cachedBuffer?: Buffer) {
    super(cachedBuffer);
    this._stblContent = content;
  }

  /**
   * Returns a new, empty String Table resource.
   */
  static create(): StringTableResource {
    return new StringTableResource({ nextID: 0, entries: [] });
  }

  /**
   * Returns a new String Table resource read from the given buffer.
   * 
   * @param buffer Buffer to read as a string table
   * @param options Options to configure for reading a STBL resource
   */
  static from(buffer: Buffer, options?: ReadStringTableOptions): StringTableResource {
    try {
      return new StringTableResource(readSTBL(buffer, options), buffer);
    } catch (e) {
      if (options !== undefined && options.dontThrow) {
        return undefined;
      } else {
        throw e;
      }
    }
  }

  /**
   * Merges a variable number of string tables into one. Does not mutate the 
   * orignal STBLs, just creates a new one.
   * 
   * @param stbls String tables to merge
   */
  static merge(...stbls: StringTableResource[]): StringTableResource {
    const mergedStbl = StringTableResource.create();
    stbls.forEach(stbl => {
      stbl.getEntries().forEach(entry => {
        mergedStbl.addEntry(entry.key, entry.string);
      });
    });
    return mergedStbl;
  }

  clone(): StringTableResource {
    const content: StringTableContent = {
      nextID: 0,
      entries: this._stblContent.entries.map((entry, id) => ({
        id,
        key: entry.key,
        string: entry.string
      }))
    };

    return new StringTableResource(content);
  }

  //#endregion Initialization

  //#region Public Methods - Add

  /**
   * Adds an entry to this string table and returns its generated ID. Will throw
   * if the given key is larger than 32-bit.
   * 
   * @param key The string's key
   * @param string The string
   */
  addEntry(key: number, string: string): number {
    if (key > 0xFFFFFFFF) throw new Error("Key must be 32-bit.");
    const id = this._stblContent.nextID++;
    const entry = { id, key, string };
    this._stblContent.entries.push(entry);
    return id;
  }

  /**
   * Adds the given `string` to this table, using the FNV-32 hash generated from
   * the given `name`. If no name is given, the string itself is hashed.
   * 
   * @param string String to add to this table
   * @param name Text to get the hash from
   */
  addStringAndHash(string: string, name?: string): number {
    const key = fnv32(name === undefined ? string : name);
    return this.addEntry(key, string);
  }

  /**
   * Adds all entries from all given string tables into this one. Entries are
   * cloned and are given new IDs relative to this table.
   * 
   * @param stbls String tables to add entries from
   */
  combine(...stbls: StringTableResource[]) {
    stbls.forEach(stbl => {
      stbl.getEntries().forEach(entry => {
        this.addEntry(entry.key, entry.string);
      });
    });
  }

  //#endregion Public Methods - Add

  //#region Public Methods - Update

  /**
   * Updates the first entry that matches the given predicate with the given
   * data in `value`. If either `key` or `string` is left out, it will not be
   * modified (for example, if you just want to change the string, simply leave
   * out the `key` argument). The previous key and string of the entry will be
   * returned; if none matched the predicate, undefined is returned.
   * 
   * @param predicate Predicate to determine which entry to update
   * @param value New key and/or string for the entry
   */
  updateEntry(predicate: StringEntryPredicate, value: { key?: number; string?: string; }): KeyStringPair {
    return this._updateEntry(this.getEntry(predicate), value);
  }

  /**
   * Updates the entry that has the given ID with the data in `value`. If either
   * `key` or `string` is left out, it will not be modified (for example, if you
   * just want to change the string, simply leave out the `key` argument). The
   * previous key and string of the entry will be returned; if none have the 
   * given ID, then undefined is returned.
   * 
   * @param id ID of the entry to update
   * @param value New key and/or string for the entry
   */
  updateEntryById(id: number, value: { key?: number; string?: string; }): KeyStringPair {
    return this._updateEntry(this.getEntryById(id), value);
  }

  /**
   * Updates the first entry that has the given key with the data in `value`. If
   * either `key` or `string` is left out, it will not be modified (for example,
   * if you just want to change the string, simply leave out the `key`
   * argument). The previous key and string of the entry will be returned; if
   * none have the given key, then undefined is returned.
   * 
   * @param key Key of the entry to update
   * @param value New key and/or string for the entry
   */
  updateEntryByKey(key: number, value: { key?: number; string?: string; }): KeyStringPair {
    return this._updateEntry(this.getEntryByKey(key), value);
  }

  /**
   * Updates the entry at the given index with the data in `value`. If either 
   * `key` or `string` is left out, it will not be modified (for example, if you
   * just want to change the string, simply leave out the `key` argument). The
   * previous key and string of the entry will be returned; the given index is
   * out of bounds, then undefined is returned.
   * 
   * @param index Index of the entry to update
   * @param value New key and/or string for the entry
   */
  updateEntryByIndex(index: number, value: { key?: number; string?: string; }): KeyStringPair {
    return this._updateEntry(this.getEntryByIndex(index), value);
  }

  //#endregion Public Methods - Update

  //#region Public Methods - Remove

  /**
   * Removes and returns the entry that matches the given predicate. If no
   * entries match, then nothing will change and `undefined` will be returned.
   * 
   * @param predicate Predicate to determine which string to remove
   */
  removeEntry(predicate: StringEntryPredicate): StringEntry {
    const index = this._stblContent.entries.findIndex(predicate);
    return this.removeEntryByIndex(index);
  }

  /**
   * Removes and returns all entries that match the given predicate. If no
   * entries match the predicate, nothing will change and an empty array will
   * be returned.
   * 
   * @param predicate Predicate to determine which strings to remove
   */
  removeEntries(predicate: StringEntryPredicate): StringEntry[] {
    const indices: number[] = [];
    this._stblContent.entries.forEach((entry, i) => {
      if (predicate(entry)) indices.push(i);
    });

    const deletedEntries: StringEntry[] = [];
    indices.forEach(index => {
      const entry = this.removeEntryByIndex(index - deletedEntries.length);
      deletedEntries.push(entry);
    });

    return deletedEntries;
  }

  /**
   * Removes and returns the entry with the given ID. If no entries have this
   * ID, then nothing will change and `undefined` will be returned.
   * 
   * @param id The ID of the entry to remove
   */
  removeEntryById(id: number): StringEntry {
    return this.removeEntry(entry => entry.id === id);
  }

  /**
   * Removes and returns the entry with the given key. If no entries have this
   * key, then nothing will change and `undefined` will be returned.
   * 
   * @param key The key of the entry to remove
   */
  removeEntryByKey(key: number): StringEntry {
    return this.removeEntry(entry => entry.key === key);
  }

  /**
   * Removes and returns the entry at the given index. If this index is out of
   * bounds, nothing changes and `undefined` is returned.
   * 
   * @param index Index of the entry to remove
   */
  removeEntryByIndex(index: number): StringEntry {
    const entry = this.getEntryByIndex(index);
    if (entry === undefined) return undefined;
    this._stblContent.entries.splice(index, 1);
    return entry;
  }

  //#endregion Public Methods - Remove

  //#region Public Methods - Get

  /**
  * Returns the first entry that matches the given predicate, or undefined if
  * none match.
  * 
  * Do not mutate the object that is output. Doing so will break things.
  * 
  * @param predicate Predicate to filter strings by
  */
  getEntry(predicate: StringEntryPredicate): StringEntry {
    return this._stblContent.entries.find(predicate);
  }

  /**
  * Returns all entries that match the given predicate if there if one. If
  * there is no predicate, all strings are returned. If no strings match the
  * predicate, an empty array is returned.
  * 
  * Do not mutate the objects that are output. Doing so will break things.
  * 
  * @param predicate Optional predicate to filter strings by
  */
  getEntries(predicate?: StringEntryPredicate): StringEntry[] {
    if (predicate === undefined) {
      return this._stblContent.entries;
    } else {
      return this._stblContent.entries.filter(predicate);
    }
  }

  /**
  * Returns the entry that has the given ID, or undefined if there isn't one.
  * 
  * Do not mutate the object that is output. Doing so will break things.
  * 
  * @param id The unique identifier for a string entry
  */
  getEntryById(id: number): StringEntry {
    // this can be optimized with binary search, but is it worth it?
    return this.getEntry(entry => entry.id === id);
  }

  /**
  * Returns the first entry that has the given key, or undefined if none do.
  * 
  * Do not mutate the object that is output. Doing so will break things.
  * 
  * @param key The key for a string entry
  */
  getEntryByKey(key: number): StringEntry {
    return this.getEntry(entry => entry.key === key);
  }

  /**
  * Returns all entries that have the given key, or an empty list if there are
  * none that do.
  * 
  * Do not mutate the objects that are output. Doing so will break things.
  * 
  * @param key The key for a string entry
  */
  getEntriesByKey(key: number): StringEntry[] {
    return this.getEntries(entry => entry.key === key);
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
  searchByString(string: string, options?: StringSearchOptions): StringEntry[] {
    const checkCase = options !== undefined && options.caseSensitive;
    const checkSubstrings = options !== undefined && options.includeSubstrings;

    return this._stblContent.entries.filter(entry => {
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
   * Returns the entry at the given index. If the index is out of bounds, then
   * `undefined` is returned.
   * 
   * @param index Index of entry to get
   */
  getEntryByIndex(index: number): StringEntry {
    if (index < 0 || index >= this.numEntries()) return undefined;
    return this._stblContent.entries[index];
  }

  //#endregion Public Methods - Get

  //#region Public Methods - Utility

  /**
  * Returns the number of entries that match the given predicate, or the total
  * number of entries if none is given.
  * 
  * @param predicate Optional predicate to filter strings by
  */
  numEntries(predicate?: StringEntryPredicate): number {
    return this.getEntries(predicate).length;
  }

  /**
   * Finds and returns any errors that are in this string table. Returns an
   * empty array if there are no errors.
   */
  findErrors(): { error: StringTableError; entries: StringEntry[]; }[] {
    const keyMap: { [key: number]: StringEntry[] } = {};
    const stringMap: { [key: string]: StringEntry[] } = {};

    this.getEntries().forEach(entry => {
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

  //#endregion Public Methods - Utility

  //#region Protected Methods

  protected _serialize(): Buffer {
    return writeSTBL(this._stblContent);
  }

  //#endregion Protected Methods

  //#region Private Methods

  /**
   * Updates the entry with the given values, and returns the previous value.
   * 
   * @param entry Entry to update
   * @param value New value of entry
   */
  private _updateEntry(entry: StringEntry, value: { key?: number; string?: string }): KeyStringPair {
    if (entry === undefined) return undefined;
    const prev = { key: entry.key, string: entry.string };
    if (value.key !== undefined) {
      if (value.key > 0xFFFFFFFF) throw new Error("Key must be 32-bit.");
      entry.key = value.key;
    }
    if (value.string !== undefined) entry.string = value.string;
    return prev;
  }

  //#endregion Private Methods
}

//#region Interfaces & Types

type StringTableError = 'Duplicate Keys' | 'Duplicate Strings' | 'Empty String';

type StringEntryPredicate = (entry: StringEntry) => boolean;

interface StringSearchOptions {
  caseSensitive?: boolean;
  includeSubstrings?: boolean;
}

interface StringEntry {
  readonly id: number;
  key: number;
  string: string;
}

interface KeyStringPair {
  key: number;
  string: string;
}

interface StringTableContent {
  /** The ID to use for the next entry that is added. */
  nextID: number;

  /** An array of entries sorted by ID. */
  entries: StringEntry[];
}

class ReadStringTableError extends Error { }

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
function readSTBL(buffer: Buffer, options?: ReadStringTableOptions): StringTableContent {
  const decoder = new BinaryDecoder(buffer);

  if (options === undefined || !options.ignoreErrors) {
    // mnFileIdentifier
    if (decoder.charsUtf8(4) !== "STBL")
      throw new ReadStringTableError("Not a string table.");

    // mnVersion
    if (decoder.uint16() !== 5)
      throw new ReadStringTableError("Version must be 5.");
  } else {
    decoder.skip(6);
  }
  
  decoder.skip(1); // mnCompressed (uint8; has no use, will never be set)
  const mnNumEntries = decoder.uint64();
  decoder.skip(6); // mReserved (2 bytes) + mnStringLength (uint32; 4 bytes)

  const entries: StringEntry[] = [];
  for (let id = 0; id < mnNumEntries; id++) {
    const key = decoder.uint32();
    decoder.skip(1); // mnFlags (uint8; has no use, will never be set)
    const stringLength = decoder.uint16();
    const string = stringLength > 0 ? decoder.charsUtf8(stringLength) : '';
    entries.push({ id, key, string });
  }

  return { nextID: entries.length, entries };
}

/**
 * Writes STBL content to a buffer.
 * 
 * @param stbl STBL content to serialize
 */
function writeSTBL(stbl: StringTableContent): Buffer {
  let totalBytes = 21; // num bytes in header
  let totalStringLength = 0;
  const stringLengths: number[] = [];
  stbl.entries.forEach(entry => {
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
  encoder.uint64(stbl.entries.length); // mnNumEntries
  encoder.skip(2); // mReserved (should be null)
  encoder.uint32(totalStringLength); // mnStringLength
  stbl.entries.forEach((entry, index) => {
    encoder.uint32(entry.key);
    encoder.skip(1); // mnFlags (should be null)
    encoder.uint16(stringLengths[index]);
    encoder.charsUtf8(entry.string);
  });

  return buffer;
}

//#endregion Serialization
