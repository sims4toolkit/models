import Resource from "./Resource";
import type { ResourceVariant } from "./Resource";
import { BinaryEncoder, BinaryDecoder } from "../../utils/encoding";

/**
 * A resource that contains string table data.
 */
export default class StringTableResource extends Resource {
  readonly variant: ResourceVariant = 'STBL';
  private _stbl: BinarySTBL;

  private constructor(stbl: BinarySTBL, cachedBuffer?: Buffer) {
    super(cachedBuffer);
    this._stbl = stbl;
  }

  /**
   * Returns a new, empty String Table resource.
   */
  static create(): StringTableResource {
    return new StringTableResource(defaultBinarySTBL());
  }

  /**
   * Returns a new String Table resource read from the given buffer.
   * 
   * @param buffer Buffer to read as a string table
   */
  static from(buffer: Buffer): StringTableResource {
    return new StringTableResource(readSTBL(buffer), buffer);
  }

  protected _serialize(): Buffer {
    return writeSTBL(this._stbl);
  }
}

/**
 * Data structure for the value output by the STBL binary template.
 */
interface BinarySTBL {
  mnFileIdentifier: string; // 4 chars, utf8
  mnVersion: number; // uint16
  mnCompressed: number; // uint8
  mnNumEntries: bigint; // uint64
  mReserved: number[]; // 2 bytes
  mnStringLength: number; // uint32
  mStrings: {
    mnKeyHash: number; // uint32
    mnFlags: number; // uint8
    mnLength: number; // uint16
    mString: string; // chars of length mnLength
  }[];
}

/**
 * Creates an empty BinarySTBL for use in the making of a new StringTable.
 */
function defaultBinarySTBL(): BinarySTBL {
  return {
    mnFileIdentifier: 'STBL',
    mnVersion: 5,
    mnCompressed: 1,
    mnNumEntries: 0n,
    mReserved: [0, 0],
    mnStringLength: 0,
    mStrings: []
  }
}

/**
 * Reads a STBL from a Buffer following the String Table binary template.
 * 
 * @param buffer The Buffer to read a STBL from
 * @returns The STBL read from the Buffer
 */
function readSTBL(buffer: Buffer): BinarySTBL {
  const decoder = new BinaryDecoder(buffer);
  
  const mnFileIdentifier = decoder.charsUtf8(4);
  if (mnFileIdentifier !== "STBL")
    throw new Error("[STBL-000] Not a string table.");

  const mnVersion = decoder.uint16();
  if (mnVersion !== 5)
    throw new Error("[STBL-001] Version number is incorrect.");

  const mnCompressed = decoder.uint8();
  const mnNumEntries = decoder.uint64();
  const mReserved = decoder.bytes(2);
  const mnStringLength = decoder.uint32();

  const mStrings = [];
  for (let i = 0; i < mnNumEntries; i++) {
    const mnKeyHash = decoder.uint32();
    const mnFlags = decoder.uint8();
    const mnLength = decoder.uint16();
    const mString = mnLength > 0 ? decoder.charsUtf8(mnLength) : '';
    mStrings.push({
      mnKeyHash,
      mnFlags,
      mnLength,
      mString
    });
  }

  return {
    mnFileIdentifier,
    mnVersion,
    mnCompressed,
    mnNumEntries,
    mReserved,
    mnStringLength,
    mStrings
  };
}

/**
 * Writes a STBL to a Buffer following the String Table binary template.
 * 
 * @param stbl The STBL to turn into a Buffer
 */
function writeSTBL(stbl: BinarySTBL): Buffer {
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
