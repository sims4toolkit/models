import type { KeyStringPair, StringTableError } from "./shared";
import type { SerializationOptions } from "../../shared";
import { fnv32 } from "@s4tk/hashing";
import Resource from "../resource";
import { arraysAreEqual, removeFromArray } from "../../helpers";
import CacheableModel from "../../abstract/cacheableModel";
import readStbl from "./serialization/readStbl";
import writeStbl from "./serialization/writeStbl";

/**
 * Model for string table resources.
 */
export default class StringTableResource extends Resource {
  readonly variant = 'STBL';
  private _nextId: number;
  private _entries: StringEntry[];

  /**
   * An array that contains the entries for this string table. Mutating this
   * array and its contents is safe in terms of cacheing, however, you should
   * not be pushing entries here yourself. Use the `add()` method, so that IDs
   * are guaranteed to be unique.
   */
  get entries() { return this._entries; }
  private set entries(entries: StringEntry[]) {
    const owner = this._getCollectionOwner() as StringTableResource;
    entries.forEach(entry => entry.owner = owner);
    this._entries = this._getCollectionProxy(entries);
  }

  /** Shorthand for `entries.length`. */
  get length(): number { return this.entries.length; }

  //#region Initialization

  /**
   * Creates a new StringTableResource instance. This constructor is not
   * considered to be a part of the public API. Please refer to `create()` and
   * `from()` instead.
   * 
   * @param entries Entries for this string table
   * @param buffer Initial buffer to cache
   */
  protected constructor(entries: KeyStringPair[] = [], buffer?: Buffer) {
    super({ buffer });
    this.entries = entries.map((entry, id) => {
      return new StringEntry(id, entry.key, entry.string, this);
    });
    this._nextId = this.length;
  }

  /**
   * Creates and returns a new string table resource from the given entries. If
   * no entries are provided, the string table is empty.
   * 
   * @param entries Initial data for this string table 
   */
  static create(entries: KeyStringPair[] = []): StringTableResource {
    return new StringTableResource(entries);
  }

  /**
   * Returns a new String Table that was read from the given buffer.
   * 
   * @param buffer Buffer to read as a string table
   * @param options Options to configure for reading a STBL resource
   */
  static from(buffer: Buffer, options?: SerializationOptions): StringTableResource {
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

  /**
   * Combines a variable number of string tables into one. Does not mutate the 
   * orignal STBLs, just creates a new one.
   * 
   * @param stbls String tables to combine
   */
  static combine(...stbls: StringTableResource[]): StringTableResource {
    const mergedStbl = StringTableResource.create();
    stbls.forEach(stbl => {
      stbl.entries.forEach(entry => {
        mergedStbl.add(entry.key, entry.string);
      });
    });
    return mergedStbl;
  }

  clone(): StringTableResource {
    // entries will be cloned in the constructor, the buffer doesn't matter
    const buffer = this.hasChanged ? undefined : this.buffer;
    return new StringTableResource(this.entries, buffer);
  }

  //#endregion Initialization

  //#region Public Methods - CREATE

  /**
   * Creates an entry for the given key and string, adds it to the string table,
   * and returns the entry that was created. If the given key is not a positive,
   * 32-bit integer, or if it already exists in the table, an error is thrown.
   * 
   * Options
   * - `allowDuplicateKey`: If `true`, then the function will not throw when
   * adding a key that already exists. (Default = `false`)
   * 
   * @param key Key of the string to add
   * @param string String to add
   * @param options Object containing options 
   * @returns String entry that was added
   * @throws If the key is not 32-bit or if it already exists
   */
  add(key: number, string: string, { allowDuplicateKey = false } = {}): StringEntry {
    if (key < 0 || key > 0xFFFFFFFF)
      throw new Error(`Tried to add key that is not a uint32: ${key}`);
    if (!allowDuplicateKey && this.getByKey(key))
      throw new Error(`Tried to add key that already exists: ${key}`);
    const entry = new StringEntry(this._nextId++, key, string, this);
    this.entries.push(entry);
    return entry;
  }

  /**
   * Creates the key for the given string and adds it to the string table. If
   * the key already exists, an exception will be thrown. The entry object that
   * is created will be returned.
   * 
   * Options
   * - `toHash`: If provided, this will be hashed to create the key. If not, 
   * then the string itself will be hashed. (Default = `undefined`)
   * - `allowDuplicateKey`: If true, then the function will not throw when
   * adding a key that already exists. (Default = `false`)
   * 
   * @param string String to add to the string table
   * @param options Object containing options 
   * @returns String entry that was added
   * @throws If the key already exists
   */
  addAndHash(string: string, { toHash, allowDuplicateKey = false }: {
    toHash?: string;
    allowDuplicateKey?: boolean;
  } = {}): StringEntry {
    return this.add(fnv32(toHash ?? string), string, { allowDuplicateKey });
  }

  /**
   * Adds all entries from all given string tables into this one. Entries are
   * cloned and are given new IDs relative to this table.
   * 
   * @param stbls String tables to add entries from
   */
  merge(...stbls: StringTableResource[]) {
    stbls.forEach(stbl => {
      stbl.entries.forEach(entry => {
        this.add(entry.key, entry.string);
      });
    });
  }

  //#endregion Public Methods - CREATE

  //#region Public Methods - READ

  equals(other: StringTableResource): boolean {
    if (!super.equals(other)) return false;
    return arraysAreEqual(this.entries, other.entries);
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

  /**
   * Finds and returns the index of the given entry.
   * 
   * @param entry Entry to find index of
   */
  findIndex(entry: StringEntry): number {
    return this.entries.findIndex(e => e.id === entry.id);
  }

  /**
   * Finds and returns the entry with the given ID.
   * 
   * @param id Id of entry to find
   */
  getById(id: number): StringEntry {
    return this.entries.find(entry => entry.id === id);
  }

  /**
   * Finds and returns the entry with the given key. If there is more than one
   * entry with the key, the first is returned.
   * 
   * @param key Key of entry to find
   */
  getByKey(key: number): StringEntry {
    return this.entries.find(entry => entry.key === key);
  }

  /**
  * Returns all entries that match the given search criteria. By default, it
  * will search for an exact, case-sensitive match.
  * 
  * Options
  * - `caseSensitive`: Whether or not to check case. (Default = `true`)
  * - `includeSubstrings`: Whether or not to search by substring rather than an
  * exact match. (Default = `false`)
  * 
  * @param string String to search for
  * @param options Object containing options
  */
  search(string: string, { caseSensitive = true, includeSubstrings = false }: {
    caseSensitive?: boolean;
    includeSubstrings?: boolean;
  } = {}): StringEntry[] {
    return this.entries.filter(entry => {
      if (includeSubstrings) {
        // substring
        return caseSensitive ?
          entry.string.includes(string) :
          entry.string.toLowerCase().includes(string.toLowerCase());
      } else {
        // exact match
        return caseSensitive ?
          entry.string === string :
          entry.string.toLowerCase() === string.toLowerCase();
      }
    });
  }

  //#endregion Public Methods - READ

  //#region Public Methods - UPDATE

  /**
   * Sorts the entries in the string table using the provided function. If no
   * function is given, they are sorted in ascending order by their string.
   * 
   * @param compareFn Function used to determine the order of the elements. It
   * is expected to return a negative value if first argument is less than
   * second argument, zero if they're equal and a positive value otherwise. If
   * omitted, the elements are sorted in ascending, ASCII character order.
   * [Copied from `Array.sort()`'s documentation]
   */
  sort(compareFn?: (a: StringEntry, b: StringEntry) => number) {
    this.entries.sort(compareFn || ((a, b) => {
      if (a.string < b.string) return -1;
      if (a.string > b.string) return 1;
      return 0;
    }));
    this.uncache();
  }

  //#endregion Public Methods - UPDATE

  //#region Public Methods - DELETE

  /**
   * Removes any number of entries from this string table. If just removing one
   * entry, consider calling its `delete()` method.
   * 
   * @param entries Entries to remove from this string table
   */
  remove(...entries: StringEntry[]) {
    removeFromArray(entries, this.entries);
  }

  //#endregion Public Methods - DELETE

  //#region Protected Methods

  protected _serialize(): Buffer {
    return writeStbl(this.entries);
  }

  //#endregion Protected Methods
}

/**
 * An entry in a StringTableResource.
 */
class StringEntry extends CacheableModel implements KeyStringPair {
  public owner?: StringTableResource;

  constructor(public readonly id: number, public key: number, public string: string, owner: StringTableResource) {
    super(owner);
    this._watchProps('key', 'string');
  }

  clone(): StringEntry {
    return new StringEntry(this.id, this.key, this.string, this.owner);
  }

  /**
   * Removes this entry from the string table that owns it.
   */
  delete() {
    this.owner?.remove(this);
  }

  /**
   * Returns whether this entry is equal to another one.
   * 
   * @param other Other entry to check for equality
   */
  equals(other: StringEntry): boolean {
    if (!other) return false;
    if (this.key !== other.key) return false;
    if (this.string !== other.string) return false;
    return true;
  }
}
