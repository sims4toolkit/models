import type Resource from "../resources/resource";
import type { ResourceKey, ResourceKeyPair } from "./types";
import type { FileReadingOptions } from "../common/options";
import { MappedModel } from "../base/mapped-model";
import { arraysAreEqual } from "../common/helpers";
import readDbpf, { extractFiles } from "./serialization/read-dbpf";
import writeDbpf from "./serialization/write-dbpf";
import ResourceEntry from "./resource-entry";

/**
 * Model for a Sims 4 package file (also called a "Database Packed File", or
 * DBPF for short).
 */
export default class Package extends MappedModel<ResourceKey, Resource, ResourceEntry> {
  private _saveCompressedBuffers: boolean;
  private _saveDecompressedBuffers: boolean;

  /** Whether or not the buffer should be cached on this model. */
  get saveBuffer() { return false; }
  set saveBuffer(saveBuffer: boolean) {
    throw new Error(`Cannot change value of saveBuffer on package. Cacheing packages consumes too much memory for no benefit. If you need to copy a package without editing anything, you can just copy/paste it like an NFT.`);
  }

  /** Whether or not compressed buffers for entries should be cached. */
  get saveCompressedBuffers() { return this._saveCompressedBuffers; }
  set saveCompressedBuffers(saveBuffers: boolean) {
    this._saveCompressedBuffers = saveBuffers ?? false;
    if (!saveBuffers) {
      this.entries.forEach(entry => {
        entry.saveBuffer = saveBuffers;
      });
    }
  }

  /** Whether or not decompressed buffers for resources should be cached. */
  get saveDecompressedBuffers() { return this._saveDecompressedBuffers; }
  set saveDecompressedBuffers(saveBuffers: boolean) {
    this._saveDecompressedBuffers = saveBuffers ?? false;
    if (!saveBuffers) {
      this.entries.forEach(entry => {
        entry.resource.saveBuffer = saveBuffers;
      });
    }
  }

  //#region Initialization

  protected constructor(
    entries?: ResourceKeyPair[],
    saveCompressedBuffers = false,
    saveDecompressedBuffers = false,
    buffer?: Buffer
  ) {
    super(entries, false, buffer); // never cache package buffer, it's pointless
    this._saveCompressedBuffers = saveCompressedBuffers;
    this._saveDecompressedBuffers = saveDecompressedBuffers;
  }

  /**
   * Creates a new Package instance from the given entries. If none are
   * provided, the package is empty.
   * 
   * Options
   * - `entries`: Array of entries to add. Empty by default.
   * - `saveCompressedBuffers`: Whether or not to cache the compressed buffers
   * for individual entries. False by default.
   * - `saveDecompressedBuffers`: Whether or not to cache the decompressed
   * buffers for individual resources. False by default.
   * 
   * @param options Optional arguments for creating a new Package
   */
  static create({ entries, saveCompressedBuffers, saveDecompressedBuffers }: {
    entries?: ResourceKeyPair[];
    saveCompressedBuffers?: boolean;
    saveDecompressedBuffers?: boolean;
  } = {}): Package {
    return new Package(entries, saveCompressedBuffers, saveDecompressedBuffers);
  }

  /**
   * Reads the given buffer as a DBPF and extracts resources from it according
   * to the given type filter function. If no function is given, all resources
   * types are extracted.
   * 
   * @param buffer Buffer to extract resources from
   * @param typeFilter Optional function to filter resources by (it should
   * accept a resource type, which is a number, and return either true or false)
   */
  static extractFiles(buffer: Buffer, typeFilter?: (type: number) => boolean): ResourceKeyPair[] {
    // FIXME: this needs a touch up
    return extractFiles(buffer, typeFilter);
  }

  /**
   * Reads the given buffer as a Package.
   * 
   * @param buffer Buffer to read as a package
   * @param options Options for reading the buffer
   */
  static from(buffer: Buffer, options?: FileReadingOptions): Package {
    return new Package(
      readDbpf(buffer, options),
      options?.saveCompressedBuffer,
      options?.saveBuffer,
      buffer
    );
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): Package {
    const buffer = this.isCached ? this.buffer : undefined;
    const entryClones = this.entries.map(entry => entry.clone());
    return new Package(
      entryClones,
      this.saveCompressedBuffers,
      this.saveDecompressedBuffers,
      buffer
    );
  }

  equals(other: Package): boolean {
    return arraysAreEqual(this.entries, other?.entries);
  }

  //#endregion Public Methods

  //#region Protected Methods

  protected _getKeyIdentifier(key: ResourceKey): string {
    return `${key.type}_${key.group}_${key.instance}`;
  }

  protected _makeEntry(key: ResourceKey, value: Resource, dto?: ResourceKeyPair): ResourceEntry {
    return new ResourceEntry(key, value, this.saveCompressedBuffers, dto?.buffer, this);
  }

  protected _serialize(): Buffer {
    return writeDbpf(this.entries);
  }

  //#endregion Protected Methods
}
