import type Resource from "../resources/resource";
import type { ResourceKey, ResourceKeyPair } from "./types";
import type { PackageFileReadingOptions } from "../common/options";
import { MappedModel } from "../base/mapped-model";
import { arraysAreEqual, promisify } from "../common/helpers";
import readDbpf from "./serialization/read-dbpf";
import writeDbpf from "./serialization/write-dbpf";
import ResourceEntry from "./resource-entry";

/**
 * Model for a Sims 4 package file (also called a "Database Packed File", or
 * DBPF for short).
 */
export default class Package extends MappedModel<ResourceKey, Resource, ResourceEntry> {
  //#region Initialization

  /**
   * Creates a new Package from the given entries.
   * 
   * @param entries Entries to initialize Package with
   */
  constructor(entries?: ResourceKeyPair[]) {
    super(entries); // never cache package buffer, it's pointless
  }

  /**
   * Reads the given buffer as a Package.
   * 
   * @param buffer Buffer to read as a package
   * @param options Options for reading and cacheing the resources
   */
  static from(buffer: Buffer, options?: PackageFileReadingOptions): Package {
    return new Package(readDbpf(buffer, options));
  }

  /**
    * Asynchronously reads the given buffer as a Package.
    * 
    * @param buffer Buffer to read as a package
    * @param options Options for reading and cacheing the resources
    */
  static async fromAsync(buffer: Buffer, options?: PackageFileReadingOptions): Promise<Package> {
    return promisify(() => Package.from(buffer, options));
  }

  /**
   * Reads the given buffer as a Package, but just returns its entries rather
   * than a full Package object.
   * 
   * @param buffer Buffer to extract resources from
   * @param options Options for reading and cacheing the resources
   */
  static extractResources(buffer: Buffer, options?: PackageFileReadingOptions): ResourceKeyPair[] {
    return readDbpf(buffer, options);
  }

  /**
   * Asynchronously reads the given buffer as a Package, but just returns its entries rather
   * than a full Package object.
   * 
   * @param buffer Buffer to extract resources from
   * @param options Options for reading and cacheing the resources
   */
  static async extractResourcesAsync(buffer: Buffer, options?: PackageFileReadingOptions): Promise<ResourceKeyPair[]> {
    return promisify(() => Package.extractResources(buffer, options));
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): Package {
    return new Package(this.entries.map(entry => entry.clone()));
  }

  equals(other: Package): boolean {
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
