import * as zlib from 'zlib';
import { BinaryDecoder, BinaryEncoder } from '../utils/encoding';
import { makeList } from '../utils/helpers';
import { BinaryResourceType, TuningResourceType } from '../enums/ResourceType';
import Resource from './resources/resource';
import SimData from './resources/simdata';
import StringTable from './resources/stringtable';
import Tuning from './resources/tuning';
import Unsupported from './resources/unsupported';
import { buffer } from 'stream/consumers';
import RawResource from './resources/raw';

/**
 * Model for a Database Packed File (DBPF).
 */
export default class DBPF {
  private _cachedBuffer?: Buffer;
  private _entries: ResourceEntry[];

  private constructor(entries: ResourceEntry[], buffer?: Buffer) {
    this._cachedBuffer = buffer;
    this._entries = entries;
  }

  /**
   * Creates and returns a new, empty DBPF.
   */
  static create(): DBPF {
    return new DBPF([]);
  }

  /**
   * Creates a new DBPF from a buffer that contains binary data.
   */
  static from(buffer: Buffer, options?: DBPFOptions): DBPF {
    return new DBPF(readDBPF(buffer, options), buffer);
  }

  /**
   * Returns a buffer that contains this DBPF in binary form.
   */
  getBuffer(): Buffer {
    if (this._cachedBuffer === undefined) this._cachedBuffer = writeDBPF(this);
    return this._cachedBuffer;
  }

  /**
   * TODO:
   * 
   * @param predicate TODO:
   * @returns TODO:
   */
  numEntries(predicate?: ResourceEntryPredicate): number {
    return this.getEntries(predicate).length;
  }

  /**
   * TODO:
   * 
   * @param predicate TODO:
   * @returns TODO:
   */
  getEntries(predicate?: ResourceEntryPredicate): ResourceEntry[] {
    if (predicate === undefined) return this._entries;
    return this._entries.filter(predicate);
  }

  /**
   * Clears the cached buffer for this DBPF. This should be called by any of the
   * contained records when they are updated.
   */
  protected _uncache() {
    // TODO: impl
  }
}

//#region Types & Interfaces

class ReadDBPFError extends Error { }

type ResourceEntryPredicate = (entry: ResourceEntry) => boolean;

/**
 * Options to configure when creating a new DBPF.
 */
 interface DBPFOptions {
  ignoreErrors: boolean;
  loadRaw: boolean;
}

/**
 * The combination of type, group, and instance used to identify individual
 * resources by the game. There is no guarantee that resource keys are unique
 * within a DBPF, and resource keys are allowed to be changed. For reliable
 * uniqueness and stability, use the ResourceEntry's `id` property.
 */
interface ResourceKey {
  type: number;
  group: number;
  instance: bigint;
}

/**
 * A wrapper for a resource to track its metadata within a DBPF.
 */
interface ResourceEntry {
  readonly id: number;
  key: ResourceKey;
  resource: Resource;
  cachedBuffer?: Buffer;
}

/**
 * An entry that appears in the index of a binary DBPF.
 */
interface IndexEntry {
  type: number;
  group: number;
  instance: bigint;
  position: number;
  size: number;
  isCompressed: boolean;
  compressionType?: number; // only if isCompressed
  committed?: number; // only if isCompressed
}

//#endregion Types & Interfaces

//#region Functions

/**
 * Gets the correct resource model for the given entry.
 * 
 * @param entry Index entry header for this resource
 * @param rawBuffer Buffer containing the resource's data
 * @returns Parsed model for the resource
 */
function getResourceModel(entry: IndexEntry, rawBuffer: Buffer): Resource {
  let buffer: Buffer;

  if (entry.isCompressed) {
    if (entry.compressionType === 23106) {
      buffer = zlib.unzipSync(rawBuffer);
    } else {
      return Unsupported.from(rawBuffer, `Compression: ${entry.compressionType}`);
    }
  } else {
    buffer = rawBuffer;
  }

  if (entry.type === BinaryResourceType.StringTable) {
    return StringTable.from(buffer);
  } else if (entry.type === BinaryResourceType.SimData) {
    return SimData.from(buffer);
  } else if (entry.type in TuningResourceType || isXML(buffer)) {
    return Tuning.from(buffer);
  } else {
    return Unsupported.from(buffer, `Unrecognized non-XML type: ${entry.type}`);
  }
}

/**
 * Determines whether this buffer has an XML header.
 * 
 * @param buffer Buffer to check the contents of
 * @returns True if XML header present, else false
 */
function isXML(buffer: Buffer): boolean {
  return buffer.length >= 5 && buffer.slice(0, 5).toString('utf-8') === '<?xml';
}

//#endregion Functions

//#region Serialization

/**
 * Reads the given buffer as a DBPF and returns its resource entries.
 * 
 * @param buffer Buffer to read as a DBPF
 * @param ignoreErrors Whether or not non-fatal errors should be ignored
 */
function readDBPF(buffer: Buffer, options?: DBPFOptions): ResourceEntry[] {
  const decoder = new BinaryDecoder(buffer);

  const validateErrors = options === undefined ? true : !options.ignoreErrors;
  const loadFilesAsRaw = options === undefined ? false : options.loadRaw;

  //#region Header

  if (decoder.charsUtf8(4) !== "DBPF") {
    if (validateErrors) throw new ReadDBPFError("Not a package file");
  }

  const versionMajor = decoder.uint32();
  const versionMinor = decoder.uint32();
  if (versionMajor !== 2 || versionMinor !== 1) {
    if (validateErrors) throw new ReadDBPFError("File version must be 2.1");
  }
  
  decoder.skip(24); // mnUserVersion through unused2
  const mnIndexRecordEntryCount = decoder.uint32();
  const mnIndexRecordPositionLow = decoder.uint32();
  decoder.skip(4); // mnIndexRecordSize (uint32; 4 bytes)
  decoder.skip(12); // unused3 (three uint32s; 12 bytes)
  const unused4 = decoder.uint32();
  if (unused4 !== 3) {
    if (validateErrors) throw new ReadDBPFError("Unused4 must be 3");
  }
  const mnIndexRecordPosition = decoder.uint64();
  // don't need to skip unused5 because decoder is about to seek

  //#endregion Header

  //#region Entries

  decoder.seek(mnIndexRecordPosition || mnIndexRecordPositionLow);

  // flags is a uint32, but only first 3 bits are used
  const flags = decoder.uint8();
  decoder.skip(3); // skip 3 bytes to keep math simple
  let constantTypeId: number, constantGroupId: number, constantInstanceIdEx: number;
  const constantType = flags & 0b1;
  const constantGroup = flags & 0b10;
  const constantInstanceEx = flags & 0b100;
  if (constantType) constantTypeId = decoder.uint32();
  if (constantGroup) constantGroupId = decoder.uint32();
  if (constantInstanceEx) constantInstanceIdEx = decoder.uint32();

  const index = makeList<IndexEntry>(mnIndexRecordEntryCount, () => {
    const entry: { [key: string]: any; } = {};
    entry.type = constantType ? constantTypeId : decoder.uint32();
    entry.group = constantGroup ? constantGroupId : decoder.uint32();
    const mInstanceEx = constantInstanceEx ? constantInstanceIdEx : decoder.uint32();
    const mInstance = decoder.uint32();
    entry.instance = (BigInt(mInstanceEx) << 32n) + BigInt(mInstance);
    entry.position = decoder.uint32(); // mnPosition
    const sizeAndCompression = decoder.uint32();
    entry.size = sizeAndCompression & 0x7FFFFFFF; // mnSize; 31 bits
    entry.isCompressed = (sizeAndCompression >>> 31) === 1; // mbExtendedCompressionType; 1 bit
    decoder.skip(4); // mnSizeDecompressed (uint32; 4 bytes)
    if (entry.isCompressed) {
      entry.compressionType = decoder.uint16(); // mnCompressionType
      entry.committed = decoder.uint16(); // mnCommitted
    }
    return entry as IndexEntry;
  });

  const getResourceFn: (entry: IndexEntry, buffer: Buffer) => Resource =
    loadFilesAsRaw ? (_, buffer) => RawResource.from(buffer)
                   : getResourceModel;

  return index.map((entry, id) => {
    decoder.seek(entry.position);
    const buffer = decoder.slice(entry.size);

    return {
      id,
      key: {
        type: entry.type,
        group: entry.group,
        instance: entry.instance
      },
      resource: getResourceFn(entry, buffer)
    };
  });

  //#endregion Entries
}

/**
 * Writes the given DBPF into a buffer.
 * 
 * @param dbpf DBPF model to serialize into a buffer
 */
function writeDBPF(dbpf: DBPF): Buffer {
  const recordsBuffer: Buffer = (() => {
    const buffer = Buffer.alloc(0); // FIXME: find size
    const encoder = new BinaryEncoder(buffer);

    // TODO:

    return buffer;
  })();

  const indexBuffer: Buffer = (() => {
    // each entry is 32 bytes, and flags are 4
    const buffer = Buffer.alloc(dbpf.numEntries() * 32 + 4);
    const encoder = new BinaryEncoder(buffer);

    encoder.uint32(0); // flags will always be null

    dbpf.getEntries().forEach(entry => {
      encoder.uint32(entry.key.type);
      encoder.uint32(entry.key.group);
      // TODO: instance ex
      // TODO: instance
      // TODO: position
      // TODO: size & compressed flag (size | 0x80000000)
      // TODO: size decompressed
      encoder.uint16(23106); // ZLIB compression
      encoder.uint32(1); // committed FIXME: is this always 1?
    });

    return buffer;
  })();

  const headerBuffer: Buffer = (() => {
    const buffer = Buffer.alloc(96);
    const encoder = new BinaryEncoder(buffer);

    encoder.charsUtf8("DBPF");
    encoder.uint32(2); // version major
    encoder.uint32(1); // version minor
    encoder.skip(24); // mnUserVersion through unused2
    encoder.uint32(dbpf.numEntries());
    encoder.uint32(0); // FIXME: what is the low pos?
    encoder.uint32(indexBuffer.length); // index size
    encoder.skip(12); // unused3
    encoder.uint32(3); // unused4
    encoder.uint64(recordsBuffer.length + 96); // index position
    // intentionally ignoring unused5

    return buffer;
  })();

  return Buffer.concat([
    headerBuffer,
    recordsBuffer,
    indexBuffer
  ]);
}

//#endregion Serialization
