import * as zlib from 'zlib';
import { BinaryDecoder, BinaryEncoder } from '../utils/encoding';
import { makeList } from '../utils/helpers';
import { Resource, ResourceEntry, ResourceKey } from './resources/ResourceBase';
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
}

//#region Interfaces

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
      // TODO:
    } else {
      return Unsupported.from(rawBuffer);
    }
  }
  const buffer = entry.isCompressed
  let buffer: Buffer = indexEntry.mnCompressionType === 23106 ? zlib.unzipSync(rawRecord.data) : rawRecord.data;

  // FIXME: this should take in the type of the record, and determine the file type that way
  // FIXME: using the first 4 chars is just a temporary hack and can NOT go into production

  if (buffer.length < 4) return Unsupported.from(buffer);
  const firstFour = buffer.slice(0, 4).toString('utf-8');
  switch (firstFour) {
    case "<?xm":
      return Tuning.from(buffer);
    case "STBL":
      return StringTable.from(buffer);
    case "DATA":
      return SimData.from(buffer);
    default:
      return Unsupported.from(buffer);
  }
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
  const mnIndexRecordSize = decoder.uint32();
  decoder.skip(12); // unused3 (three uint32s; 12 bytes)
  const unused4 = decoder.uint32();
  if (unused4 !== 3) {
    if (!ignoreErrors) throw new ReadDBPFError("Unused4 must be 3");
  }
  const mnIndexRecordPosition = decoder.uint64();
  // unused5 (six uint32s; 24 bytes)
  // don't need to skip unused5 because decoder is about to seek

  //#endregion Header

  //#region Flags

  decoder.seek(mnIndexRecordPosition || mnIndexRecordPositionLow);

  const flags = decoder.uint32();
  // TODO: uncomment when flags are testable
  // let constantTypeId: number, constantGroupId: number, constantInstanceIdEx: number;
  // const constantType = flags & 0x10000000;
  // const constantGroup = flags & 0x20000000;
  // const constantInstanceEx = flags & 0x40000000;
  // if (constantType) constantTypeId = decoder.uint32();
  // if (constantGroup) constantGroupId = decoder.uint32();
  // if (constantInstanceEx) constantInstanceIdEx = decoder.uint32();
  // TODO: do not throw error for non-zero flags, just doing this for now 
  // because I cannot find any packages that contain flags, and I therefore
  // cannot test it, and cannot put untested code into production
  if (flags !== 0) {
    // intentionally not checking for !ignoreErrors
    throw new ReadDBPFError("Flags are non-zero.");
  }

  //#endregion Flags

  //#region Entries

  const index = makeList<IndexEntry>(mnIndexRecordEntryCount, () => {
    // TODO: uncomment when flags are implemented and testable
    // let mType: number, mGroup: number, mInstanceEx: number;
    // if (!constantType) mType = decoder.uint32();
    // if (!constantGroup) mGroup = decoder.uint32();
    // if (!constantInstanceEx) mInstanceEx = decoder.uint32();
    const entry: { [key: string]: any; } = {};
    entry.type = decoder.uint32(); // mType
    entry.group = decoder.uint32(); // mGroup
    const mInstanceEx = decoder.uint32();
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

//#endregion Serialization
