import * as zlib from "zlib";
import { BinaryDecoder } from "@s4tk/encoding";
import { makeList } from "../../helpers";
import RawResource from "../../resources/generic/rawResource";
import Resource from "../../resources/resource";
import SimDataResource from "../../resources/simData/simDataResource";
import StringTableResource from "../../resources/stringTable/stringTableResource";
import TuningResource from "../../resources/tuning/tuningResource";
import { DbpfDto } from "../shared";
import { SerializationOptions } from "../../shared";

//#region Types & Interfaces

type ResourceType = BinaryResourceType | TuningResourceType;

enum BinaryResourceType {
  SimData = 0x545AC67A,
  StringTable = 0x220557DA,
}

enum TuningResourceType {
  Buff = 0x6017E896,
  Trait = 0xCB5FDDC7,
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
      return RawResource.from(rawBuffer, `Compression: ${entry.compressionType}`);
    }
  } else {
    buffer = rawBuffer;
  }

  if (entry.type === BinaryResourceType.StringTable) {
    return StringTableResource.from(buffer);
  } else if (entry.type === BinaryResourceType.SimData) {
    return SimDataResource.from(buffer);
  } else if (entry.type in TuningResourceType || isXML(buffer)) {
    return TuningResource.from(buffer);
  } else {
    return RawResource.from(buffer, `Unrecognized non-XML type: ${entry.type}`);
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


/**
 * Reads the given buffer as a DBPF and returns its resource entries.
 * 
 * @param buffer Buffer to read as a DBPF
 * @param ignoreErrors Whether or not non-fatal errors should be ignored
 */
export default function readDbpf(buffer: Buffer, options?: SerializationOptions): DbpfDto {
  const decoder = new BinaryDecoder(buffer);

  const validateErrors = options === undefined ? true : !options.ignoreErrors;
  const loadFilesAsRaw = options === undefined ? false : options.loadRaw;

  //#region Header

  if (decoder.charsUtf8(4) !== "DBPF") {
    if (validateErrors) throw new Error("Not a package file");
  }

  const versionMajor = decoder.uint32();
  const versionMinor = decoder.uint32();
  if (versionMajor !== 2 || versionMinor !== 1) {
    if (validateErrors) throw new Error("File version must be 2.1");
  }
  
  decoder.skip(24); // mnUserVersion through unused2
  const mnIndexRecordEntryCount = decoder.uint32();
  const mnIndexRecordPositionLow = decoder.uint32();
  decoder.skip(4); // mnIndexRecordSize (uint32; 4 bytes)
  decoder.skip(12); // unused3 (three uint32s; 12 bytes)
  const unused4 = decoder.uint32();
  if (unused4 !== 3) {
    if (validateErrors) throw new Error("Unused4 must be 3");
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

  return undefined;
  // return index.map((entry, id) => {
  //   decoder.seek(entry.position);
  //   const buffer = decoder.slice(entry.size);

  //   return {
  //     id,
  //     key: {
  //       type: entry.type,
  //       group: entry.group,
  //       instance: entry.instance
  //     },
  //     resource: getResourceFn(entry, buffer)
  //   };
  // });

  //#endregion Entries
}
