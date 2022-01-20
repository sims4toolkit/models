import type Resource from "../../resources/resource";
import type { SerializationOptions } from "../../shared";
import type { ResourceKey, ResourceKeyPair } from "../shared";
import { BinaryDecoder } from "@s4tk/encoding";
import { makeList } from "../../helpers";
import RawResource from "../../resources/generic/rawResource";

/**
 * Reads the given buffer as a DBPF and returns a DTO for it.
 * 
 * @param buffer Buffer to read as a DBPF
 * @param options Options for reading DBPF
 */
export default function readDbpf(buffer: Buffer, {
  ignoreErrors = false,
  loadRaw = false
}: SerializationOptions = {}): ResourceKeyPair[] {
  const decoder = new BinaryDecoder(buffer);

  const header = readDbpfHeader(decoder, ignoreErrors);
  decoder.seek(header.mnIndexRecordPosition || header.mnIndexRecordPositionLow);
  const flags = readDbpfFlags(decoder);

  const getResourceFn: (entry: IndexEntry, buffer: Buffer) => Resource =
    loadRaw ? (_, buffer) => RawResource.from(buffer)
            : getResourceModel;

  const index = makeList<IndexEntry>(header.mnIndexRecordEntryCount, () => {
    const entry: Partial<IndexEntry> = {};
    entry.key.type = flags.constantTypeId ?? decoder.uint32();
    entry.key.group = flags.constantGroupId ?? decoder.uint32();
    const mInstanceEx = flags.constantInstanceIdEx ?? decoder.uint32();
    const mInstance = decoder.uint32();
    entry.key.instance = (BigInt(mInstanceEx) << 32n) + BigInt(mInstance);
    entry.mnPosition = decoder.uint32();
    const sizeAndCompression = decoder.uint32();
    entry.mnSize = sizeAndCompression & 0x7FFFFFFF; // 31 bits
    const isCompressed = (sizeAndCompression >>> 31) === 1; // mbExtendedCompressionType; 1 bit
    decoder.skip(4); // mnSizeDecompressed (uint32; 4 bytes)
    if (isCompressed) entry.mnCompressionType = decoder.uint16();
    decoder.skip(2); // mnCommitted (uint16; 2 bytes)
    return entry as IndexEntry;
  });

  return index.map(entry => {
    decoder.seek(entry.mnPosition);
    const buffer = decoder.slice(entry.mnSize);

    return {
      key: entry.key,
      value: getResourceFn(entry, buffer)
    };
  });
}

//#region Types & Interfaces

interface DbpfHeader {
  mnIndexRecordEntryCount: number;
  mnIndexRecordPositionLow: number;
  mnIndexRecordSize: number;
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
function readDbpfHeader(decoder: BinaryDecoder, ignoreErrors: boolean): DbpfHeader {
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
  header.mnIndexRecordSize = decoder.uint32();
  decoder.skip(12); // unused3 has no affect

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

//#endregion Helpers
