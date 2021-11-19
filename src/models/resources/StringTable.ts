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
    return new StringTableResource({ entryList: [], entryMap: {} });
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

  // TODO: impl

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
  decoder.skip(2); // mReserved (2 bytes) + mnStringLength (uint32; 4 bytes)

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

  return { entryList, entryMap };
}

/**
 * Writes a STBL to a Buffer following the String Table binary template.
 * 
 * @param stbl The STBL to turn into a Buffer
 */
function writeSTBL(stbl: StringTableContent): Buffer {
  let totalBytes = 21; // num bytes in header
  stbl.mStrings.forEach(stringEntry => { totalBytes += 7 + stringEntry.mnLength });
  const buffer = Buffer.alloc(totalBytes);
  const encoder = new BinaryEncoder(buffer);

  encoder.charsUtf8(stbl.mnFileIdentifier);
  encoder.uint16(stbl.mnVersion);
  encoder.uint8(stbl.mnCompressed);
  encoder.uint64(stbl.mnNumEntries);
  stbl.mReserved.forEach(byte => { encoder.uint8(byte); });
  encoder.uint32(stbl.mnStringLength);
  stbl.mStrings.forEach(stringEntry => {
    encoder.uint32(stringEntry.mnKeyHash);
    encoder.uint8(stringEntry.mnFlags);
    encoder.uint16(stringEntry.mnLength);
    encoder.charsUtf8(stringEntry.mString);
  });

  return buffer;
}

//#endregion Serialization