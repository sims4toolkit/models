import * as zlib from 'zlib';
import { BinaryDecoder, BinaryEncoder } from '../utils/encoding';
import { makeList } from '../utils/helpers';
import { BinaryResourceType, TuningResourceType } from '../enums/ResourceType';
import { Resource } from './resources/ResourceBase';
import SimData from './resources/SimData';
import StringTable from './resources/StringTable';
import Tuning from './resources/Tuning';
import Unsupported from './resources/Unsupported';

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
   * 
   * @returns New DBPF object
   */
  static create(): DBPF {
    return new DBPF([]);
  }

  /**
   * Creates a new DBPF from the given buffer.
   * 
   * @param buffer Buffer to read as DBPF
   * @returns New DBPF object from given buffer
   */
  static from(buffer: Buffer): DBPF {
    return new DBPF(readDBPF(buffer), buffer);
  }

  /**
   * Returns a buffer that contains this DBPF in binary form.
   * 
   * @returns This DBPF serialized in a buffer
   */
  getBuffer(): Buffer {
    if (this._cachedBuffer === undefined) this._cachedBuffer = writeDBPF(this);
    return this._cachedBuffer;
  }
}

//#region Interfaces

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

//#endregion Interfaces

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

//#region Exceptions

class ReadDBPFError extends Error { }
class WriteDBPFError extends Error { }

//#endregion Exceptions

//#region Serialization

/**
 * Reads the given buffer as a DBPF and returns its resource entries.
 * 
 * @param buffer Buffer to read as a DBPF
 * @param ignoreErrors Whether or not non-fatal errors should be ignored
 */
function readDBPF(buffer: Buffer, ignoreErrors?: boolean): ResourceEntry[] {
  const decoder = new BinaryDecoder(buffer);

  //#region Header

  if (decoder.charsUtf8(4) !== "DBPF") {
    if (!ignoreErrors) throw new ReadDBPFError("Not a package file");
  }

  // reading mnFileVersion
  const versionMajor = decoder.uint32();
  const versionMinor = decoder.uint32();
  if (versionMajor !== 2 || versionMinor !== 1) {
    if (!ignoreErrors) throw new ReadDBPFError("File version must be 2.1");
  }
  
  // mnUserVersion (two uint32s; 8 bytes)
  // unused1 (uint32; 4 bytes)
  // mnCreationTime (time_t; 4 bytes)
  // mnUpdatedTime (time_t; 4 bytes)
  // unused2 (uint32; 4 bytes)
  decoder.skip(24);

  const mnIndexRecordEntryCount = decoder.uint32();
  const mnIndexRecordPositionLow = decoder.uint32();
  decoder.skip(4); // mnIndexRecordSize (uint32; 4 bytes)
  decoder.skip(12); // unused3 (three uint32s; 12 bytes)
  const unused4 = decoder.uint32();
  if (unused4 !== 3) {
    if (!ignoreErrors) throw new ReadDBPFError("Unused4 must be 3");
  }
  const mnIndexRecordPosition = decoder.uint64();
  // unused5 (six uint32s; 24 bytes)
  // don't need to skip unused5 because decoder is about to seek

  //#endregion Header

  //#region Entries

  decoder.seek(mnIndexRecordPosition || mnIndexRecordPositionLow);

  // flags is a uint32, but only first 3 bits are used
  const flags = decoder.uint8();
  decoder.skip(3);
  let constantTypeId: number, constantGroupId: number, constantInstanceIdEx: number;
  const constantType = flags & 0x80;
  const constantGroup = flags & 0x40;
  const constantInstanceEx = flags & 0x20;
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
      resource: getResourceModel(entry, buffer)
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
  // TODO: impl
  return undefined;
}

//#endregion Serialization
