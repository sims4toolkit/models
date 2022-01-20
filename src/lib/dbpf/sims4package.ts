import type Resource from "../resources/resource";
import type CacheableModel from "../base/cacheableModel";
import type { ResourceKey, ResourceKeyPair } from "./shared";
import type { SerializationOptions } from "../shared";
import { MappedModel } from "../base/mappedModel";
import { arraysAreEqual } from "../helpers";
import readDbpf from "./serialization/readDbpf";
import writeDbpf from "./serialization/writeDbpf";
import ResourceEntry from "./resourceEntry";

/**
 * Model for a Sims 4 package file (also called a "Database Packed File", or
 * DBPF for short).
 */
export default class Sims4Package extends MappedModel<ResourceKey, Resource, ResourceEntry> {
  //#region Initialization

  protected constructor(entries: ResourceKeyPair[], buffer?: Buffer, owner?: CacheableModel) {
    super(entries, { buffer, owner });
  }

  /**
   * Creates a new Sims4Package instance from the given entries. If none are
   * provided, the package is empty by default.
   * 
   * @param entries Resource entries to use in this package. Empty by default.
   */
  static create(entries: ResourceKeyPair[] = []): Sims4Package {
    return new Sims4Package(entries);
  }

  /**
   * Reads the given buffer as a Sims4Package.
   * 
   * @param buffer Buffer to read as a package
   * @param options Options for reading the buffer
   */
  static from(buffer: Buffer, options?: SerializationOptions): Sims4Package {
    return new Sims4Package(readDbpf(buffer, options), buffer);
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): Sims4Package {
    const buffer = this.hasChanged ? undefined : this.buffer;
    return new Sims4Package(this.entries, buffer);
  }

  equals(other: Sims4Package): boolean {
    return arraysAreEqual(this.entries, other?.entries);
  }

  //#endregion Public Methods

  //#region Protected Methods

  protected _getKeyIdentifier(key: ResourceKey): string {
    return `${key.type}_${key.group}_${key.instance}`;
  }

  protected _makeEntry(key: ResourceKey, value: Resource): ResourceEntry {
    return new ResourceEntry(key, value, this);
  }

  protected _serialize(): Buffer {
    return writeDbpf(this.entries);
  }

  //#endregion Protected Methods
}
