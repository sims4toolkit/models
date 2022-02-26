import type Resource from "../resources/resource";
import type { ResourceKey, ResourceKeyPair } from "./types";
import type { FileReadingOptions } from "../common/options";
import { MappedModel } from "../base/mapped-model";
import { arraysAreEqual, promisify } from "../common/helpers";
import readDbpf from "./serialization/read-dbpf";
import writeDbpf from "./serialization/write-dbpf";
import ResourceEntry from "./resource-entry";
import clone from "just-clone";

/**
 * Model for a Sims 4 package file (also called a "Database Packed File", or
 * DBPF for short).
 */
export default class Package extends MappedModel<ResourceKey, Resource, ResourceEntry> {
  //#region Initialization

  protected constructor(entries?: ResourceKeyPair[]) {    
    super(entries, false, undefined, undefined); // never cache package buffer, it's pointless
  }

  /**
   * Creates a new Package instance from the given entries. If none are
   * provided, the package is empty.
   * 
   * Options
   * - `entries`: Array of entries to add. New entry objects will be created for
   * the package, but keys and resources will not be cloned unless told to with
   * the `cloneKeys` and `cloneResources` options. Empty by default.
   * - `cloneKeys`: Whether or not to clone the keys before adding them to the
   * package. False by default.
   * - `cloneResources`: Whether or not to clone the resource before adding them
   * to the package. False by default.
   * 
   * @param options Optional arguments for creating a new Package
   */
  static create({ entries = [], cloneKeys = false, cloneResources = false }: {
    entries?: ResourceKeyPair[];
    cloneKeys?: boolean;
    cloneResources?: boolean;
  } = {}): Package {
    let entriesToUse: ResourceKeyPair[];

    if (cloneKeys || cloneResources) {
      entriesToUse = entries.map(entry => {
        return {
          key: cloneKeys ? clone(entry.key) : entry.key,
          value: cloneResources ? entry.value.clone() : entry.value
        }
      });
    } else {
      entriesToUse = entries;
    }

    return new Package(entriesToUse);
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
   * Reads the given buffer as a Package asynchronously, and returns a Promise
   * that resolves with its entries in an array.
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
  static async extractResourcesAsync(buffer: Buffer, options?: FileReadingOptions): Promise<ResourceKeyPair[]> {
    return promisify(() => Package.extractResources(buffer, options));
  }

  /**
   * Reads the given buffer as a Package.
   * 
   * @param buffer Buffer to read as a package
   * @param options Options for reading and cacheing the resources
   */
  static from(buffer: Buffer, options?: FileReadingOptions): Package {
    return new Package(readDbpf(buffer, options));
  }

  /**
   * Reads the given buffer as a Package asynchronously, and returns a Promise
   * that resolves with it.
   * 
   * @param buffer Buffer to read as a package
   * @param options Options for reading and cacheing the resources
   */
  static async fromAsync(buffer: Buffer, options?: FileReadingOptions): Promise<Package> {
    return promisify(() => Package.from(buffer, options));
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
