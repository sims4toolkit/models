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
export default class Package<ResourceType extends Resource = Resource>
  extends MappedModel<ResourceKey, ResourceType, ResourceEntry<ResourceType>> {

  //#region Initialization

  /**
   * Creates a new Package from the given entries.
   * 
   * @param entries Entries to initialize Package with
   */
  constructor(entries?: ResourceKeyPair<Resource>[]) {
    // intentionally using Resource in arguments so that ResourceType isn't
    // automatically inferred from the first element
    super(entries as ResourceKeyPair<ResourceType>[]);
  }

  /**
   * Reads the given buffer as a Package.
   * 
   * @param buffer Buffer to read as a package
   * @param options Options for reading and cacheing the resources
   */
  static from<T extends Resource = Resource>(
    buffer: Buffer,
    options?: PackageFileReadingOptions
  ): Package<T> {
    return new Package<T>(readDbpf(buffer, options) as ResourceKeyPair<T>[]);
  }

  /**
    * Asynchronously reads the given buffer as a Package.
    * 
    * @param buffer Buffer to read as a package
    * @param options Options for reading and cacheing the resources
    */
  static async fromAsync<T extends Resource = Resource>(
    buffer: Buffer,
    options?: PackageFileReadingOptions
  ): Promise<Package<T>> {
    return promisify(() => Package.from<T>(buffer, options));
  }

  /**
   * Reads the given buffer as a Package, but just returns its entries rather
   * than a full Package object.
   * 
   * @param buffer Buffer to extract resources from
   * @param options Options for reading and cacheing the resources
   */
  static extractResources<T extends Resource = Resource>(
    buffer: Buffer,
    options?: PackageFileReadingOptions
  ): ResourceKeyPair<T>[] {
    return readDbpf(buffer, options) as ResourceKeyPair<T>[];
  }

  /**
   * Asynchronously reads the given buffer as a Package, but just returns its
   * entries rather than a full Package object.
   * 
   * @param buffer Buffer to extract resources from
   * @param options Options for reading and cacheing the resources
   */
  static async extractResourcesAsync<T extends Resource = Resource>(
    buffer: Buffer,
    options?: PackageFileReadingOptions
  ): Promise<ResourceKeyPair<T>[]> {
    return promisify(() => Package.extractResources<T>(buffer, options));
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): Package<ResourceType> {
    return new Package<ResourceType>(this.entries.map(entry => entry.clone()));
  }

  equals(other: Package): boolean {
    return arraysAreEqual(this.entries, other?.entries);
  }

  //#endregion Public Methods

  //#region Protected Methods

  protected _getKeyIdentifier(key: ResourceKey): string {
    return `${key.type}_${key.group}_${key.instance}`;
  }

  protected _makeEntry(
    key: ResourceKey,
    value: ResourceType
  ): ResourceEntry<ResourceType> {
    return new ResourceEntry(key, value, this);
  }

  protected _serialize(): Buffer {
    return writeDbpf(this.entries);
  }

  //#endregion Protected Methods
}
