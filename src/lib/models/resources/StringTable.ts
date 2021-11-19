import Resource from "./Resource";
import type { ResourceVariant } from "./Resource";
import { BinaryEncoder, BinaryDecoder } from "../../utils/encoding";

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
  public static create(): StringTableResource {
    return new StringTableResource({ nextID: 0, entries: [] });
  }

  /**
   * Returns a new String Table resource read from the given buffer.
   * 
   * @param buffer Buffer to read as a string table
   * @param options Options to configure for reading a STBL resource
   */
  public static from(buffer: Buffer, options?: ReadStringTableOptions): StringTableResource {
    return new StringTableResource(readSTBL(buffer, options), buffer);
  }

  //#endregion Initialization

  //#region Abstract Methods

  protected _serialize(): Buffer {
    return writeSTBL(this._stblContent);
  }

  //#endregion Abstract Methods

  //#region Public Methods

  /**
   * Adds an entry to this string table and returns its generated ID.
   * 
   * @param key The string's key
   * @param string The string
   */
  addEntry(key: number, string: string): number {
    const id = this._stblContent.nextID++;
    const entry = { id, key, string };
    this._stblContent.entries.push(entry);
    return id;
  }

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
  getEntriesByString(string: string, options?: StringSearchOptions): StringEntry[] {
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

  //#endregion Public Methods
}

//#region Interfaces & Types

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

interface StringTableContent {
  /** The ID to use for the next entry that is added. */
  nextID: number;

  /** An array of entries sorted by ID. */
  entries: StringEntry[];
}

class ReadStringTableError extends Error { }

interface ReadStringTableOptions {
  ignoreErrors: boolean;
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