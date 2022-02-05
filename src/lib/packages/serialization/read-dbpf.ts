import type Resource from "../../resources/resource";
import type { FileReadingOptions, ResourceFilter } from "../../common/options";
import type { ResourceKeyPair, ResourceKey } from "../types";
import { BinaryDecoder } from "@s4tk/encoding";
import { bufferContainsXml, makeList } from "../../common/helpers";
import RawResource from "../../resources/raw/raw-resource";
import BinaryResourceType from "../../enums/binary-resources";
import TuningResourceType from "../../enums/tuning-resources";
import StringTableResource from "../../resources/stbl/stbl-resource";
import SimDataResource from "../../resources/simdata/simdata-resource";
import XmlResource from "../../resources/xml/xml-resource";
import CombinedTuningResource from "../../resources/combined-tuning/combined-tuning-resource";
import decompressBuffer from "../../compression/decompress";

/**
 * Reads the given buffer as a DBPF and returns a DTO for it.
 * 
 * @param buffer Buffer to read as a DBPF
 * @param options Options for reading DBPF
 */
export default function readDbpf(buffer: Buffer, options: FileReadingOptions = {}): ResourceKeyPair[] {
  const decoder = new BinaryDecoder(buffer);
  const header = readDbpfHeader(decoder, options);
  decoder.seek(header.mnIndexRecordPosition || header.mnIndexRecordPositionLow);
  const flags = readDbpfFlags(decoder);
  const index = readDbpfIndex(decoder, header, flags, options?.resourceFilter);
  return index.map(indexEntry => {
    decoder.seek(indexEntry.mnPosition);
    const compressedBuffer = decoder.slice(indexEntry.mnSize);
    const entry: ResourceKeyPair = {
      key: indexEntry.key,
      value: getResource(indexEntry, compressedBuffer, options)
    };
    if (options?.saveCompressedBuffer) entry.buffer = compressedBuffer;
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
  mnSizeDecompressed: number;
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
function readDbpfHeader(decoder: BinaryDecoder, { ignoreErrors = false }: FileReadingOptions): DbpfHeader {
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
 * @param filter Optional function to filter out resources by type/group/inst
 */
function readDbpfIndex(decoder: BinaryDecoder, header: DbpfHeader, flags: DbpfFlags, filter?: ResourceFilter): IndexEntry[] {
  return makeList<IndexEntry>(header.mnIndexRecordEntryCount, () => {
    const key: Partial<ResourceKey> = {};
    key.type = flags.constantTypeId ?? decoder.uint32();
    key.group = flags.constantGroupId ?? decoder.uint32();
    const mInstanceEx = flags.constantInstanceIdEx ?? decoder.uint32();
    const mInstance = decoder.uint32();
    key.instance = (BigInt(mInstanceEx) << 32n) + BigInt(mInstance);

    if (filter && !filter(key.type, key.group, key.instance)) {
      decoder.skip(4);
      const sizeAndCompression = decoder.uint32();
      const isCompressed = (sizeAndCompression >>> 31) === 1;
      decoder.skip(isCompressed ? 8 : 6); // +2 for mnCompressionType
      return;
    } else {
      const entry: Partial<IndexEntry> = { key: key as ResourceKey };
      entry.mnPosition = decoder.uint32();
      const sizeAndCompression = decoder.uint32();
      entry.mnSize = sizeAndCompression & 0x7FFFFFFF; // 31 bits
      const isCompressed = (sizeAndCompression >>> 31) === 1; // mbExtendedCompressionType; 1 bit
      entry.mnSizeDecompressed = decoder.uint32();
      if (isCompressed) entry.mnCompressionType = decoder.uint16();
      decoder.skip(2); // mnCommitted (uint16; 2 bytes)
      return entry as IndexEntry;
    }
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
function getResource(entry: IndexEntry, rawBuffer: Buffer, options?: FileReadingOptions): Resource {
  if (options?.loadRaw && !options?.decompressRawResources) {
    const isCompressed = Boolean(entry.mnCompressionType);
    return RawResource.from(rawBuffer, entry.mnCompressionType, isCompressed);
  }

  try {
    var buffer = decompressBuffer(buffer, entry.mnCompressionType, entry.mnSizeDecompressed);
  } catch (e) {
    return RawResource.from(buffer, entry.mnCompressionType, true, e);
  }

  const raw = (reason?: string) => RawResource.from(buffer, entry.mnCompressionType, false, reason);
  if (options?.loadRaw) return raw();
  
  const { type } = entry.key;

  try {
    if (type === BinaryResourceType.StringTable) {
      return StringTableResource.from(buffer, options);
    } else if (type === BinaryResourceType.SimData) {
      return SimDataResource.from(buffer, options);
    } else if (type === BinaryResourceType.CombinedTuning) {
      return CombinedTuningResource.from(buffer);
    } else if ((type in TuningResourceType) || bufferContainsXml(buffer)) {
      return XmlResource.from(buffer, options);
    } else {
      return raw(`Unrecognized non-XML type: ${type}`);
    }
  } catch (e) {
    if (options?.loadErrorsAsRaw) {
      return raw("Model is corrupt.");
    } else {
      throw e;
    }
  }
}

//#endregion Helpers
