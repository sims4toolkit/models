import type Resource from "../resources/resource";
import type { ResourceKey, ResourceKeyPair } from "./types";
import type { FileReadingOptions } from "../common/options";
import { MappedModel } from "../base/mapped-model";
import { arraysAreEqual } from "../common/helpers";
import readDbpf from "./serialization/read-dbpf";
import writeDbpf from "./serialization/write-dbpf";
import ResourceEntry from "./resource-entry";

/**
 * Model for a Sims 4 package file (also called a "Database Packed File", or
 * DBPF for short).
 */
export default class Package extends MappedModel<ResourceKey, Resource, ResourceEntry> {
  private _saveCompressedBuffers: boolean;
  private _saveDecompressedBuffers: boolean;

  get saveBuffer() { return false; }
  set saveBuffer(saveBuffer: boolean) {
    // intentionally blank; packages can never be cached
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
    saveDecompressedBuffers = false
  ) {    
    super(undefined, false); // never cache package buffer, it's pointless
    this._saveCompressedBuffers = saveCompressedBuffers;
    this._saveDecompressedBuffers = saveDecompressedBuffers;
    this._initializeEntries(entries); // has to happen after props are set
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
   * Reads the given buffer as a Package, but just returns its entries rather
   * than a full Package object.
   * 
   * If extracting resources to write them to disk, consider these options:
   * - Set `loadRaw: true`, so that resources are loaded as buffers only rather
   * than being parsed into models.
   * - If you cannot use `loadRaw` because you need to parse the resources into
   * models, set `saveBuffer: true` so that they can be written without needing
   * to re-serialize the model.
   * - Consider using `resourceFilter` to determine which resources should be
   * extracted, according to their type, group, and/or instance.
   * 
   * @param buffer Buffer to extract resources from
   * @param options Options for reading and cacheing the resources
   */
  static extractResources(buffer: Buffer, options?: FileReadingOptions): ResourceKeyPair[] {
    return readDbpf(buffer, options);
  }

  /**
   * Reads the given buffer as a Package.
   * 
   * @param buffer Buffer to read as a package
   * @param options Options for reading and cacheing the resources
   */
  static from(buffer: Buffer, options?: FileReadingOptions): Package {
    return new Package(
      readDbpf(buffer, options),
      options?.saveCompressedBuffer,
      options?.saveBuffer
    );
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): Package {
    return new Package(
      this.entries.map(entry => entry.clone()),
      this.saveCompressedBuffers,
      this.saveDecompressedBuffers
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
    value.saveBuffer = this.saveDecompressedBuffers;
    return new ResourceEntry(key, value, this.saveCompressedBuffers, dto?.buffer, this);
  }

  protected _serialize(): Buffer {
    return writeDbpf(this.entries);
  }

  //#endregion Protected Methods
}
