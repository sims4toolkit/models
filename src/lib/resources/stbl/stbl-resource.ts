import type { KeyStringPair } from "./types";
import { fnv32 } from "@s4tk/hashing";
import { CompressionType } from "@s4tk/compression";
import { PrimitiveMappedModel } from "../../base/primitive-mapped-model";
import Resource from "../resource";
import { arraysAreEqual, promisify } from "../../common/helpers";
import { FileReadingOptions } from "../../common/options";
import readStbl from "./serialization/read-stbl";
import writeStbl from "./serialization/write-stbl";
import EncodingType from "../../enums/encoding-type";
import StringEntry from "./string-entry";

/**
 * Model for string table (STBL) resources.
 */
export default class StringTableResource extends PrimitiveMappedModel<string, StringEntry> implements Resource {
  readonly encodingType: EncodingType = EncodingType.STBL;
  readonly compressionType: CompressionType = CompressionType.ZLIB;
  readonly isCompressed: boolean = false;

  //#region Initialization

  protected constructor(
    entries?: KeyStringPair[],
    saveBuffer?: boolean,
    buffer?: Buffer
  ) {
    super(entries, saveBuffer, buffer);
  }

  /**
   * Creates a new StringTableResource instance with the given entries, if any.
   * If no entries are provided, an empty STBL is created.
   * 
   * @param entries Optional entries to create STBL with
   */
  static create({ entries, saveBuffer }: {
    entries?: KeyStringPair[];
    saveBuffer?: boolean;
  } = {}): StringTableResource { 
    return new StringTableResource(entries, saveBuffer);
  }

  /**
   * Reads the given buffer as a StringTableResource and returns it.
   * 
   * @param buffer Buffer to read as a string table
   * @param options Options for reading and cacheing the STBL
   */
  static from(buffer: Buffer, options?: FileReadingOptions): StringTableResource {
    return new StringTableResource(
      readStbl(buffer, options),
      options?.saveBuffer,
      buffer
    );
  }

  /**
   * Reads the given buffer as a StringTableResource asynchronously and returns
   * a Promise that resolves with it.
   * 
   * @param buffer Buffer to read as a string table
   * @param options Options for reading and cacheing the STBL
   */
  static async fromAsync(buffer: Buffer, options?: FileReadingOptions): Promise<StringTableResource> {
    return promisify(() => StringTableResource.from(buffer, options));
  }

  //#endregion Initialization

  //#region Public Methods

  /**
   * Creates a new entry from the given string, adds it to the string table,
   * and returns it. If `toHash` is supplied, it will be hashed for the key. If
   * not, then the string itself will be hashed.
   * 
   * To ensure that strings are not duplicated, consider using the following:
   * ```ts
   * stbl.getByValue(stringToAdd) ?? stbl.addAndHash(stringToAdd)
   * ```
   * 
   * @param value String to add to table
   * @param toHash Optional string to hash for the key
   * @returns The entry object that was created
   */
  addAndHash(value: string, toHash?: string): StringEntry {
    const key = fnv32(toHash ? toHash : value);
    return this.add(key, value);
  }

  clone(): StringTableResource {
    const buffer = this.isCached ? this.buffer : undefined;
    return new StringTableResource(this.entries, this.saveBuffer, buffer);
  }

  equals(other: StringTableResource): boolean {
    return arraysAreEqual(this.entries, other?.entries);
  }

  isXml(): boolean {
    return false;
  }

  //#endregion Public Methods

  //#region Protected Methods

  protected _makeEntry(key: number, value: string): StringEntry {
    return new StringEntry(key, value, this);
  }

  protected _serialize(): Buffer {
    return writeStbl(this.entries);
  }

  //#region Protected Methods
}
