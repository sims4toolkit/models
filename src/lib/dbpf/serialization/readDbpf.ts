import type Resource from "../../resources/resource";
import type { SerializationOptions } from "../../shared";
import { ExtractionOptions, ResourceKey, ResourceKeyPair, ZLIB_COMPRESSION } from "../shared";
import { unzipSync } from "zlib";
import { BinaryDecoder } from "@s4tk/encoding";
import { makeList } from "../../helpers";
import RawResource from "../../resources/generic/rawResource";
import { BinaryResourceType, TuningResourceType } from "../../enums/resourceTypes";
import StringTableResource from "../../resources/stringTable/stringTableResource";
import SimDataResource from "../../resources/simData/simDataResource";
import TuningResource from "../../resources/tuning/tuningResource";
import XmlResource from "../../resources/generic/xmlResource";

/**
 * Reads the given buffer as a DBPF and returns a DTO for it.
 * 
 * @param buffer Buffer to read as a DBPF
 * @param options Options for reading DBPF
 */
export default function readDbpf(buffer: Buffer, options: SerializationOptions = {}, extractionOptions?: ExtractionOptions): ResourceKeyPair[] {
  const decoder = new BinaryDecoder(buffer);

  const header = readDbpfHeader(decoder, options);
  decoder.seek(header.mnIndexRecordPosition || header.mnIndexRecordPositionLow);
  const flags = readDbpfFlags(decoder);
  if (flags.constantTypeId && !shouldReadType(flags.constantTypeId, extractionOptions)) return [];
  let bytesToSkip = 20;
  if (flags.constantGroupId) bytesToSkip += 4;
  if (flags.constantInstanceIdEx) bytesToSkip += 4;

  const index = makeList<IndexEntry>(header.mnIndexRecordEntryCount, () => {
    const key: Partial<ResourceKey> = {};
    key.type = flags.constantTypeId ?? decoder.uint32();

    if (!shouldReadType(key.type, extractionOptions)) {
      decoder.skip(bytesToSkip); // remaining bytes for this index entry
      return;
    }

    key.group = flags.constantGroupId ?? decoder.uint32();
    const mInstanceEx = flags.constantInstanceIdEx ?? decoder.uint32();
    const mInstance = decoder.uint32();
    key.instance = (BigInt(mInstanceEx) << 32n) + BigInt(mInstance);
    const entry: Partial<IndexEntry> = {};
    entry.key = key as ResourceKey;
    entry.mnPosition = decoder.uint32();
    const sizeAndCompression = decoder.uint32();
    entry.mnSize = sizeAndCompression & 0x7FFFFFFF; // 31 bits
    const isCompressed = (sizeAndCompression >>> 31) === 1; // mbExtendedCompressionType; 1 bit
    decoder.skip(4); // mnSizeDecompressed (uint32; 4 bytes)
    if (isCompressed) entry.mnCompressionType = decoder.uint16();
    decoder.skip(2); // mnCommitted (uint16; 2 bytes)
    return entry as IndexEntry;
  }, true); // true to skip nulls/undefineds

  return index.map(indexEntry => {
    decoder.seek(indexEntry.mnPosition);
    const buffer = decoder.slice(indexEntry.mnSize);
    const entry: ResourceKeyPair = {
      key: indexEntry.key,
      value: getResource(indexEntry, buffer, options)
    };
    if (!extractionOptions) entry.buffer = buffer;
    return entry;
  });
}

//#region Types & Interfaces

interface DbpfHeader {
  mnIndexRecordEntryCount: number;
  mnIndexRecordPositionLow: number;
  mnIndexRecordPosition: bigint;
}

interface DbpfFlags {
  constantTypeId?: number;
  constantGroupId?: number;
  constantInstanceIdEx?: number;
}

interface IndexEntry {
  key: ResourceKey;
  mnPosition: number;
  mnSize: number;
  mnCompressionType?: number;
}

//#endregion Types & Interfaces

//#region Helpers

/**
 * Reads a DBPF header from the given decoder and returns the information that
 * is needed for reading the rest of the DBPF.
 * 
 * @param decoder Decoder to read DBPF header from
 * @param ignoreErrors Whether or not header errors should be ignored
 * @throws If ignoreErrors = false and something is wrong
 */
function readDbpfHeader(decoder: BinaryDecoder, { ignoreErrors = false }: SerializationOptions): DbpfHeader {
  const header: Partial<DbpfHeader> = {};

  if (ignoreErrors) {
    decoder.skip(12); // size of mnFileIdentifier + mnFileVersion
  } else {
    if (decoder.charsUtf8(4) !== "DBPF")
      throw new Error("Not a package file.");
    const major = decoder.uint32();
    const minor = decoder.uint32();
    if (major !== 2 || minor !== 1)
      throw new Error(`Expected DBPF version to be 2.1, got ${major}.${minor}`);
  }

  decoder.skip(24); // mnUserVersion through unused2 don't affect anything
  header.mnIndexRecordEntryCount = decoder.uint32();
  header.mnIndexRecordPositionLow = decoder.uint32();
  decoder.skip(16); // mnIndexRecordSize & unused3 has no affect

  if (ignoreErrors) {
    decoder.skip(4);
  } else {
    const unused4 = decoder.uint32();
    if (unused4 !== 3)
      throw new Error(`Expected unused4 to be 3, got ${unused4}`);
  }

  header.mnIndexRecordPosition = decoder.uint64();
  decoder.skip(24); // unused5

  return header as DbpfHeader;
}

/**
 * Reads DBPF flags from the given decoder and returns the information that
 * is needed for reading the rest of the DBPF.
 * 
 * @param decoder Decoder to read DBPF flags from
 */
function readDbpfFlags(decoder: BinaryDecoder): DbpfFlags {
  const dbpfFlags: DbpfFlags = {};

  // flags is a uint32, but only first 3 bits are used
  const flags = decoder.uint8();
  decoder.skip(3); // skip 3 bytes to keep math simple
  if (flags & 0b1) dbpfFlags.constantTypeId = decoder.uint32();
  if (flags & 0b10) dbpfFlags.constantGroupId = decoder.uint32();
  if (flags & 0b100) dbpfFlags.constantInstanceIdEx = decoder.uint32();

  return dbpfFlags;
}

/**
 * Gets the correct resource model for the given entry.
 * 
 * @param entry Index entry header for this resource
 * @param rawBuffer Buffer containing the resource's data
 * @param options Options for serialization
 * @returns Parsed model for the resource
 */
function getResource(entry: IndexEntry, rawBuffer: Buffer, options: SerializationOptions): Resource {
  let buffer: Buffer;

  if (entry.mnCompressionType) {
    if (entry.mnCompressionType === ZLIB_COMPRESSION) {
      buffer = unzipSync(rawBuffer);
    } else {
      return RawResource.from(rawBuffer, `Incompatible Compression: ${entry.mnCompressionType}`);
    }
  } else {
    buffer = rawBuffer;
  }

  if (options.loadRaw) return RawResource.from(buffer);

  const { type } = entry.key;

  if (type === BinaryResourceType.StringTable) {
    return StringTableResource.from(buffer, options);
  } else if (type === BinaryResourceType.SimData) {
    return SimDataResource.from(buffer, options);
  } else if (type in TuningResourceType) {
    return TuningResource.from(buffer);
  } else if (isXml(buffer)) {
    return XmlResource.from(buffer);
  } else {
    return RawResource.from(buffer, `Unrecognized non-XML type: ${type}`);
  }
}

/**
 * Determines whether this buffer has an XML header.
 * 
 * @param buffer Buffer to check the contents of
 * @returns True if XML header present, else false
 */
function isXml(buffer: Buffer): boolean {
  return buffer.length >= 5 && buffer.slice(0, 5).toString('utf-8') === '<?xml';
}

/**
 * Determines whether the given type should be read.
 * 
 * @param type Type to check
 * @param extractionOptions Options for extraction
 */
function shouldReadType(type: number, extractionOptions?: ExtractionOptions): boolean {
  if (!extractionOptions) return true;

  switch (type) {
    case BinaryResourceType.SimData:
      return extractionOptions.simData ?? false;
    case BinaryResourceType.StringTable:
      return extractionOptions.stringTables ?? false;
    default:
      return (extractionOptions.tuning ?? true) && (type in TuningResourceType);
  }
}

//#endregion Helpers
