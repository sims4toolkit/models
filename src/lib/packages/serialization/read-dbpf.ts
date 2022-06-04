import { CompressedBuffer, CompressionType, decompressBuffer } from "@s4tk/compression";
import { BinaryDecoder } from "@s4tk/encoding";
import type Resource from "../../resources/resource";
import type { PackageFileReadingOptions } from "../../common/options";
import type { ResourceKeyPair, ResourceKey, ResourcePosition } from "../types";
import { makeList } from "../../common/helpers";
import RawResource from "../../resources/raw/raw-resource";
import ResourceRegistry from "../resource-registry";
import { DbpfFlags, DbpfHeader, IndexEntry } from "./types";

try {
  var BufferFromFile = require("../../../ffi/bufferfromfile.node");
} catch (e) {
  var BufferFromFile;
  console.warn("MMAPs not supported on your OS.", e);
}

/**
 * Reads the given buffer as a DBPF and returns a DTO for it.
 * 
 * @param buffer Buffer to read as a DBPF
 * @param options Options for reading DBPF
 */
export function readDbpf(
  buffer: Buffer,
  options?: PackageFileReadingOptions
): ResourceKeyPair[] {
  const decoder = new BinaryDecoder(buffer);
  const header = readDbpfHeader(decoder, options);
  decoder.seek(header.mnIndexRecordPosition || header.mnIndexRecordPositionLow);
  const flags = readDbpfFlags(decoder);
  const index = readDbpfIndex(decoder, header, flags, options);
  return index.map(indexEntry => {
    decoder.seek(indexEntry.mnPosition);
    const compressedBuffer = decoder.slice(indexEntry.mnSize);
    const entry: ResourceKeyPair = {
      key: indexEntry.key,
      value: getResource(indexEntry, compressedBuffer, options)
    };
    return entry;
  });
}

/**
 * Streams resources from the file at the given location using a MMAP buffer.
 * 
 * @param filepath Path of file to read as a DBPF
 * @param options Optional arguments
 */
export function streamDbpf(
  filepath: string,
  options?: PackageFileReadingOptions
): ResourceKeyPair[] {
  if (!BufferFromFile)
    throw new Error("MMAPs not supported on your OS. Use regular Buffers.");

  const mmap = BufferFromFile.buffer(filepath);

  try {
    const header = readDbpfHeader(mmapDecoder(mmap, 0, 96));
    const flagsPos = Number(header.mnIndexRecordPosition || header.mnIndexRecordPositionLow);
    const flagsDecoder = mmapDecoder(mmap, flagsPos, 16);
    const flags = readDbpfFlags(flagsDecoder);
    const indexPos = flagsPos + flagsDecoder.tell();
    const index = streamDbpfIndex(mmap, indexPos, header, flags, options);

    const records: ResourceKeyPair[] = [];
    for (let i = 0; i < index.length; i++) {
      const indexEntry = index[i];

      const compressedBuffer = Buffer.from(mmap.slice(
        indexEntry.mnPosition,
        indexEntry.mnPosition + indexEntry.mnSize
      ));

      records.push({
        key: indexEntry.key,
        value: getResource(indexEntry, compressedBuffer, options)
      });
    }

    BufferFromFile.unmap(mmap);
    return records;
  } catch (e) {
    BufferFromFile.unmap(mmap);
    throw e;
  }
}

/**
 * Streams specific resources from the file at given positions using a MMAP.
 * Note that the filter and limit options will be ignored.
 * 
 * @param filepath Path of file to read as a DBPF
 * @param positions Specific positions of resources to fetch
 * @param options Optional arguments
 */
export function fetchResources(
  filepath: string,
  positions: ResourcePosition[],
  options?: PackageFileReadingOptions
): ResourceKeyPair[] {
  if (!BufferFromFile)
    throw new Error("MMAPs not supported on your OS. Use regular Buffers.");

  const mmap = BufferFromFile.buffer(filepath);

  try {
    const header = readDbpfHeader(mmapDecoder(mmap, 0, 96));
    const flagsPos = Number(header.mnIndexRecordPosition || header.mnIndexRecordPositionLow);
    const flags = readDbpfFlags(mmapDecoder(mmap, flagsPos, 16));

    const resources: ResourceKeyPair[] = [];
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const indexDecoder = mmapDecoder(mmap, pos.indexStart, 32); // 32 is max
      const indexEntry = readIndexEntry(indexDecoder, flags, options);

      const compressedBuffer = Buffer.from(mmap.slice(
        pos.recordStart,
        pos.recordStart + pos.recordSize
      ));

      resources.push({
        key: indexEntry.key,
        value: getResource(indexEntry, compressedBuffer, options)
      });
    }

    BufferFromFile.unmap(mmap);
    return resources;
  } catch (e) {
    BufferFromFile.unmap(mmap);
    throw e;
  }
}

//#region Helpers

/**
 * Reads a DBPF header from the given decoder and returns the information that
 * is needed for reading the rest of the DBPF.
 * 
 * @param decoder Decoder to read DBPF header from
 * @param options Object containing options
 */
function readDbpfHeader(decoder: BinaryDecoder, options?: PackageFileReadingOptions): DbpfHeader {
  const header: Partial<DbpfHeader> = {};

  if (options?.recoveryMode) {
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

  if (options?.recoveryMode) {
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
 * @param options Optional arguments
 */
function readDbpfIndex(
  decoder: BinaryDecoder,
  header: DbpfHeader,
  flags: DbpfFlags,
  options?: PackageFileReadingOptions
): IndexEntry[] {
  return makeList<IndexEntry>(
    header.mnIndexRecordEntryCount,
    () => readIndexEntry(decoder, flags, options),
    true, // true to skip nulls/undefineds
    options?.limit
  );
}

/**
 * Reads the index entries from the given decoder, only including those that
 * pass the type filter.
 * 
 * @param mmap MMAP to stream index from
 * @param start The first byte to of the first entry
 * @param header Header of DBPF that is being read
 * @param flags Flags of DBPF that is being read
 * @param options Optional arguments
 */
function streamDbpfIndex(
  mmap: any,
  start: number,
  header: DbpfHeader,
  flags: DbpfFlags,
  options?: PackageFileReadingOptions
): IndexEntry[] {
  const entries: IndexEntry[] = [];

  let bytesRead = start;
  for (let i = 0; i < header.mnIndexRecordEntryCount; i++) {
    const decoder = mmapDecoder(mmap, bytesRead, 32); // 32 is max
    const indexEntry = readIndexEntry(decoder, flags, options);
    bytesRead += decoder.tell();
    if (indexEntry) entries.push(indexEntry);
    if (options?.limit && entries.length >= options.limit) break;
  }

  return entries;
}

/**
 * Reads a resource key at the current position in the given decoder.
 * 
 * @param decoder Decoder to read key from
 * @param flags Flags of DBPF that is being read
 */
function readResourceKey(decoder: BinaryDecoder, flags: DbpfFlags): ResourceKey {
  const key: Partial<ResourceKey> = {};
  key.type = flags.constantTypeId ?? decoder.uint32();
  key.group = flags.constantGroupId ?? decoder.uint32();
  const mInstanceEx = flags.constantInstanceIdEx ?? decoder.uint32();
  const mInstance = decoder.uint32();
  key.instance = (BigInt(mInstanceEx) << 32n) + BigInt(mInstance);
  return key as ResourceKey;
}

/**
 * Reads a single index entry at the current position in the given decoder.
 * 
 * @param decoder Decoder to read index entry from
 * @param flags Flags of DBPF that is being read
 * @param options Optional arguments
 */
function readIndexEntry(
  decoder: BinaryDecoder,
  flags: DbpfFlags,
  options?: PackageFileReadingOptions
): IndexEntry {
  const key = readResourceKey(decoder, flags);

  if (
    options?.resourceFilter
    && !options?.resourceFilter(key.type, key.group, key.instance)
  ) {
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
    if (entry.mnCompressionType === CompressionType.DeletedRecord) return;
    return entry as IndexEntry;
  }
}

/**
 * Gets the correct resource model for the given entry.
 * 
 * @param entry Index entry header for this resource
 * @param rawBuffer Buffer containing the resource's data
 * @param options Options for serialization
 */
function getResource(entry: IndexEntry, rawBuffer: Buffer, options?: PackageFileReadingOptions): Resource {
  let bufferWrapper: CompressedBuffer;
  let rawReason: string;

  if (options?.decompressBuffers) {
    try {
      bufferWrapper = {
        buffer: decompressBuffer(rawBuffer, entry.mnCompressionType),
        compressionType: CompressionType.Uncompressed,
        sizeDecompressed: entry.mnSizeDecompressed
      };
    } catch (e) {
      if (!(options?.recoveryMode)) throw e;
      rawReason = `Could not decompress "${entry.mnCompressionType} (${CompressionType[entry.mnCompressionType]})".`;
    }
  } else {
    bufferWrapper = {
      buffer: rawBuffer,
      compressionType: entry.mnCompressionType,
      sizeDecompressed: entry.mnSizeDecompressed
    };
  }

  if (options?.loadRaw || rawReason) {
    return new RawResource(bufferWrapper, {
      reason: rawReason ?? "All resources loaded raw.",
      defaultCompressionType: entry.mnCompressionType
    });
  }

  const { type } = entry.key;

  const decompressedBuffer = bufferWrapper.compressionType === CompressionType.Uncompressed
    ? bufferWrapper.buffer
    : decompressBuffer(rawBuffer, entry.mnCompressionType);

  const resourceOptions = {
    defaultCompressionType: entry.mnCompressionType,
    initialBufferCache: bufferWrapper,
    recoveryMode: options?.recoveryMode,
    saveBuffer: options?.saveBuffer
  };

  try {
    const resource = ResourceRegistry.generateResourceFromBuffer(
      type,
      decompressedBuffer,
      resourceOptions
    );

    return resource ? resource : new RawResource(bufferWrapper, {
      reason: `Unregistered resource type: ${type}`
    });
  } catch (e) {
    if (!(options?.recoveryMode)) throw e;
    return new RawResource(bufferWrapper, {
      reason: `Failed to parse resource (Type: ${type})`
    });
  }
}

/**
 * Creates a decoder for a slice of the given mmap buffer.
 * 
 * @param mmap Mmap buffer to get a decoder for
 * @param start Start index of slice to create decoder for
 * @param length Length of slice to create decoder for
 */
function mmapDecoder(mmap: any, start: number, length: number): BinaryDecoder {
  return new BinaryDecoder(Buffer.from(mmap.slice(start, start + length)));
}

//#endregion Helpers
