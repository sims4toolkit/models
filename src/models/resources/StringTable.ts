import Resource from "./Resource";
import type { ResourceVariant } from "./Resource";
import { BinaryEncoder, BinaryDecoder } from "../../utils/encoding";

/**
 * A resource that contains string table data.
 */
export default class StringTableResource extends Resource {
  //#region Properties

  readonly variant: ResourceVariant = 'STBL';
  private _stblContent: StringTableContent;

  //#endregion Properties

  //#region Initialization

  private constructor(content: StringTableContent, cachedBuffer?: Buffer) {
    super(cachedBuffer);
    this._stblContent = content;
  }

  /**
   * Returns a new, empty String Table resource.
   */
  public static create(): StringTableResource {
    return new StringTableResource({ nextID: 0, entryList: [], entryMap: {} });
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
    this._stblContent.entryList.push(entry);
    let entriesWithKey = this._stblContent.entryMap[key];
    if (entriesWithKey === undefined) entriesWithKey = [];
    entriesWithKey.push(entry);
    return id;
  }

  /**
   * TODO:
   * 
   * @param predicate TODO:
   */
  removeEntry(predicate: StringEntryPredicate): StringEntry {
    // TODO:
  }

  /**
   * TODO:
   * 
   * @param predicate TODO:
   * @param limit TODO:
   */
  removeEntries(predicate: StringEntryPredicate, limit?: number): StringEntry[] {
    // TODO:
  }

  /**
   * TODO:
   * 
   * @param id TODO:
   */
  removeEntryById(id: number): StringEntry {
    // TODO:
  }

  /**
   * TODO:
   * 
   * @param id TODO:
   */
  removeEntryByKey(key: number): StringEntry {
    // TODO:
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
    return this._stblContent.entryList.find(predicate);
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
      return this._stblContent.entryList;
    } else {
      return this._stblContent.entryList.filter(predicate);
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
    const entries = this._stblContent.entryMap[key];
    if (entries === undefined || entries.length < 1) return undefined;
    return entries[0];
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
    // TODO:
  }

  /**
  * Returns the first entry that contains the given string following the given
  * options. All options are false by default, so if no options are passed,
  * the search will be for a case-insensitive exact match.
  * 
  * Do not mutate the object that is output. Doing so will break things.
  * 
  * @param string String to search for
  */
  getEntryByString(string: string, options?: StringSearchOptions): StringEntry;

  /**
  * Returns all entries that contain the given string following the given
  * options. All options are false by default, so if no options are passed,
  * the search will be for a case-insensitive exact match.
  * 
  * Do not mutate the objects that are output. Doing so will break things.
  * 
  * @param string String to search for
  */
  getEntriesByString(string: string, options?: StringSearchOptions): StringEntry[];

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
  entryList: StringEntry[];

  /** A mapping of string keys to all entries that have that key. */
  entryMap: { [key: number]: StringEntry[]; };
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

  const entryList: StringEntry[] = [];
  for (let id = 0; id < mnNumEntries; id++) {
    const key = decoder.uint32();
    decoder.skip(1); // mnFlags (uint8; has no use, will never be set)
    const stringLength = decoder.uint16();
    const string = stringLength > 0 ? decoder.charsUtf8(stringLength) : '';
    entryList.push({ id, key, string });
  }

  const entryMap: { [key: number]: StringEntry[] } = {};
  entryList.forEach(entry => {
    let entries = entryMap[entry.key];
    if (entries === undefined) entries = [];
    entries.push(entry);
  });

  return { nextID: entryList.length, entryList, entryMap };
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
  stbl.entryList.forEach(entry => {
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
  encoder.uint64(stbl.entryList.length); // mnNumEntries
  encoder.skip(2); // mReserved (should be null)
  encoder.uint32(totalStringLength); // mnStringLength
  stbl.entryList.forEach((entry, index) => {
    encoder.uint32(entry.key);
    encoder.skip(1); // mnFlags (should be null)
    encoder.uint16(stringLengths[index]);
    encoder.charsUtf8(entry.string);
  });

  return buffer;
}

//#endregion Serialization
