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
  private _saveCompressedBuffers: boolean; // FIXME: getter/setter

  /** Whether or not the buffer should be cached on this model. */
  get saveBuffer() { return false; }
  set saveBuffer(saveBuffer: boolean) {
    throw new Error(`Cannot change value of saveBuffer on package. Cacheing packages consumes too much memory for no benefit. If you need to copy a package without editing anything, you can just copy/paste it like an NFT.`);
  }

  /** TODO: docs */
  get saveCompressedBuffers() { return this._saveCompressedBuffers; }
  set saveCompressedBuffers(saveCompressedBuffers: boolean) {
    this._saveCompressedBuffers = saveCompressedBuffers ?? false;
    if (!saveCompressedBuffers) {
      // TODO: set in all entries, and delete their cache
    }
  }

  //#region Initialization

  protected constructor(
    entries?: ResourceKeyPair[],
    buffer?: Buffer,
    saveCompressedBuffers = true // FIXME: should be false by default
  ) {
    super(entries, buffer, true); // never cache package buffer, it's pointless // FIXME: should be false
    this._saveCompressedBuffers = saveCompressedBuffers;
  }

  /**
   * Creates a new Sims4Package instance from the given entries. If none are
   * provided, the package is empty by default.
   * 
   * @param entries Resource entries to use in this package. Empty by default.
   */
  static create(entries?: ResourceKeyPair[]): Package { // FIXME: should make an object to match rest of API?
    return new Package(entries); // FIXME: cache compressed buffers / buffers within the resources
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
  static extractFiles(buffer: Buffer, typeFilter?: (type: number) => boolean): ResourceKeyPair[] {
    return extractFiles(buffer, typeFilter);
  }

  /**
   * Reads the given buffer as a Sims4Package.
   * 
   * @param buffer Buffer to read as a package
   * @param options Options for reading the buffer
   */
  static from(buffer: Buffer, options?: FileReadingOptions): Package {
    return new Package(readDbpf(buffer, options), buffer);
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): Package {
    const buffer = this.isCached ? this.buffer : undefined;
    const entryClones = this.entries.map(entry => entry.clone());
    return new Package(entryClones, buffer);
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
    return new ResourceEntry(key, value, dto?.buffer, this.saveCompressedBuffers, this);
  }

  protected _serialize(): Buffer {
    return writeDbpf(this.entries);
  }

  //#endregion Protected Methods
}
