import type Resource from "../resources/resource";
import type { ResourceKey, ResourceKeyPair } from "./types";
import type { SerializationOptions } from "../shared";
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
  //#region Initialization

  protected constructor(entries: ResourceKeyPair[], buffer?: Buffer) {
    super(entries, { buffer });
  }

  /**
   * Creates a new Sims4Package instance from the given entries. If none are
   * provided, the package is empty by default.
   * 
   * @param entries Resource entries to use in this package. Empty by default.
   */
  static create(entries: ResourceKeyPair[] = []): Package {
    return new Package(entries);
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
  static from(buffer: Buffer, options?: SerializationOptions): Package {
    try {
      return new Package(readDbpf(buffer, options), buffer);
    } catch (e) {
      if (options?.dontThrow) {
        return undefined;
      } else {
        throw e;
      }
    }
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): Package {
    const buffer = this.hasChanged ? undefined : this.buffer;
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
    return new ResourceEntry(key, value, dto?.buffer, this);
  }

  protected _serialize(): Buffer {
    return writeDbpf(this.entries);
  }

  //#endregion Protected Methods
}
