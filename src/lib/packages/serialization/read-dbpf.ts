import type Resource from "../../resources/resource";
import type { SerializationOptions } from "../../shared";
import type { ResourceKeyPair, ResourceKey } from "../types";
import { ZLIB_COMPRESSION } from "../constants";
import { unzipSync } from "zlib";
import { BinaryDecoder } from "@s4tk/encoding";
import { bufferContainsXml, makeList } from "../../utils/helpers";
import RawResource from "../../resources/generic/rawResource";
import { BinaryResourceType } from "../../enums/binary-resources";
import { TuningResourceType } from "../../enums/tuning-resources";
import StringTableResource from "../../resources/stbl/stbl-resource";
import SimDataResource from "../../resources/simData/simDataResource";
import XmlResource from "../../resources/xml/xml-resource";

/**
 * Reads the given buffer as a DBPF and returns a DTO for it.
 * 
 * @param buffer Buffer to read as a DBPF
 * @param options Options for reading DBPF
 */
export default function readDbpf(buffer: Buffer, options: SerializationOptions = {}): ResourceKeyPair[] {
  const decoder = new BinaryDecoder(buffer);
  const header = readDbpfHeader(decoder, options);
  decoder.seek(header.mnIndexRecordPosition || header.mnIndexRecordPositionLow);
  const flags = readDbpfFlags(decoder);
  const index = readDbpfIndex(decoder, header, flags);
  return index.map(indexEntry => {
    decoder.seek(indexEntry.mnPosition);
    const compressedBuffer = decoder.slice(indexEntry.mnSize);
    return {
      key: indexEntry.key,
      value: getResource(indexEntry, compressedBuffer, options),
      buffer: compressedBuffer
    };
  });
}

/**
 * Reads the given buffer as a DBPF and extracts resources from it according
 * to the given type filter function. If no function is given, all resources
 * types are extracted (which would take a very, very, very long time).
 * 
 * @param buffer Buffer to extract resources from
 * @param typeFilter Optional function to filter resources by (it should
 * accept a resource type, which is a number, and return either true or false)
 */
export function extractFiles(buffer: Buffer, typeFilter?: (type: number) => boolean): ResourceKeyPair[] {
  const decoder = new BinaryDecoder(buffer);
  const header = readDbpfHeader(decoder, { ignoreErrors: true });
  decoder.seek(header.mnIndexRecordPosition || header.mnIndexRecordPositionLow);
  const flags = readDbpfFlags(decoder);
  const index = readDbpfIndex(decoder, header, flags, typeFilter);
  return index.map(indexEntry => {
    decoder.seek(indexEntry.mnPosition);
    const compressedBuffer = decoder.slice(indexEntry.mnSize);
    return {
      key: indexEntry.key,
      value: getResource(indexEntry, compressedBuffer, { loadRaw: true }),
      buffer: compressedBuffer
    };
  });
}

/**
 * Reads the given buffer as a DBPF to extract unique tuning types from. Types
 * are returned in a map (and mutated in the given map, if applicable) from
 * their hash to their name.
 * 
 * @param buffer Buffer of DBPF to read types from
 * @param baseMap Map to add type hash/name pairs to
 */
export function readTuningTypes(buffer: Buffer, baseMap?: Map<number, string>): Map<number, string> {
  const decoder = new BinaryDecoder(buffer);
  const header = readDbpfHeader(decoder, { ignoreErrors: true });
  decoder.seek(header.mnIndexRecordPosition || header.mnIndexRecordPositionLow);
  const flags = readDbpfFlags(decoder);

  const map: Map<number, string> = baseMap ?? new Map();
  const index = readDbpfIndex(decoder, header, flags, (type: number) => {
    if (map.has(type)) return false;
    map.set(type, null);
    return true;
  });

  index.forEach(indexEntry => {
    try {
      decoder.seek(indexEntry.mnPosition);
      const compressedBuffer = decoder.slice(indexEntry.mnSize);
      const resource = getResource(indexEntry, compressedBuffer, { loadRaw: true }) as RawResource;
      if (resource.isXml()) {
        const xml = XmlResource.from(resource.buffer);
        const typeName = xml.root.attributes.i;
        if (typeName) map.set(indexEntry.key.type, typeName);
      }
    } catch (e) {
      // intentionally blank -- just skip it if it cannot be parsed
    }
  });

  return map;
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
 * Reads the index entries from the given decoder, only including those that
 * pass the type filter.
 * 
 * @param decoder Decoder to read DBPF index from
 * @param header Header of DBPF that is being read
 * @param flags Flags of DBPF that is being read
 * @param typeFilter Optional function to filter out resources of certain types
 */
function readDbpfIndex(decoder: BinaryDecoder, header: DbpfHeader, flags: DbpfFlags, typeFilter?: (type: number) => boolean): IndexEntry[] {
  let bytesToSkip = 20;
  if (flags.constantGroupId == undefined) bytesToSkip += 4;
  if (flags.constantInstanceIdEx == undefined) bytesToSkip += 4;

  return makeList<IndexEntry>(header.mnIndexRecordEntryCount, () => {
    const key: Partial<ResourceKey> = {};
    key.type = flags.constantTypeId ?? decoder.uint32();

    if (typeFilter && !typeFilter(key.type)) {
      decoder.skip(bytesToSkip);
      return;
    }

    key.group = flags.constantGroupId ?? decoder.uint32();
    const mInstanceEx = flags.constantInstanceIdEx ?? decoder.uint32();
    const mInstance = decoder.uint32();
    key.instance = (BigInt(mInstanceEx) << 32n) + BigInt(mInstance);
    const entry: Partial<IndexEntry> = { key: key as ResourceKey };
    entry.mnPosition = decoder.uint32();
    const sizeAndCompression = decoder.uint32();
    entry.mnSize = sizeAndCompression & 0x7FFFFFFF; // 31 bits
    const isCompressed = (sizeAndCompression >>> 31) === 1; // mbExtendedCompressionType; 1 bit
    decoder.skip(4); // mnSizeDecompressed (uint32; 4 bytes)
    if (isCompressed) entry.mnCompressionType = decoder.uint16();
    decoder.skip(2); // mnCommitted (uint16; 2 bytes)
    return entry as IndexEntry;
  }, true); // true to skip nulls/undefineds
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
  } else if ((type in TuningResourceType) || bufferContainsXml(buffer)) {
    return XmlResource.from(buffer);
  } else {
    return RawResource.from(buffer, `Unrecognized non-XML type: ${type}`);
  }
}

//#endregion Helpers
