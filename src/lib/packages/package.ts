import { fnv64 } from "@s4tk/hashing";
import type { ResourceKey, ResourceKeyPair, ResourcePosition } from "./types";
import type Resource from "../resources/resource";
import { MappedModel } from "../base/mapped-model";
import type { PackageFileReadingOptions } from "../common/options";
import { arraysAreEqual, promisify } from "../common/helpers";
import { fetchResources, getResourcePositions, readDbpf, streamDbpf } from "./serialization/read-dbpf";
import writeDbpf from "./serialization/write-dbpf";
import ResourceEntry from "./resource-entry";
import BinaryResourceType from "../enums/binary-resources";
import TuningResourceType from "../enums/tuning-resources";
import XmlResource from "../resources/xml/xml-resource";
import CombinedTuningResource from "../resources/combined-tuning/combined-tuning-resource";

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

  /**
   * Streams resources from the file at the given location. This method is much,
   * much more space and time efficient than extractResources() when using a
   * resource filter and/or a limit. But, if reading an entire package, it will
   * likely perform the same or even slower.
   * 
   * NOTE: This function requires `@s4tk/plugin-bufferfromfile`, and will throw
   * if you do not have it installed.
   * 
   * @param filepath Absolute path to file to read as a package
   * @param options Options for reading the resources
   */
  static streamResources<T extends Resource = Resource>(
    filepath: string,
    options?: PackageFileReadingOptions
  ): ResourceKeyPair<T>[] {
    return streamDbpf(filepath, options) as ResourceKeyPair<T>[];
  }

  /**
   * Asynchronously streams resources from the file at the given location. This
   * method is much, much more space and time efficient than
   * extractResourcesAsync() when using a resource filter and/or a limit. But,
   * if reading an entire package, it will likely perform the same or even
   * slower.
   * 
   * NOTE: This function requires `@s4tk/plugin-bufferfromfile`, and will throw
   * if you do not have it installed.
   * 
   * @param filepath Absolute path to file to read as a package
   * @param options Options for reading the resources
   */
  static async streamResourcesAsync<T extends Resource = Resource>(
    filepath: string,
    options?: PackageFileReadingOptions
  ): Promise<ResourceKeyPair<T>[]> {
    return promisify(() => Package.streamResources(filepath, options));
  }

  /**
   * Fetches specific resources from the file at the given location. This method
   * is incredibly fast, but requires an index to be used, which takes time to
   * build up. Note that the filter and limit options will be ignored.
   * 
   * NOTE: This function requires `@s4tk/plugin-bufferfromfile`, and will throw
   * if you do not have it installed.
   * 
   * @param filepath Absolute path to file to read as a package
   * @param positions Array containing objects that contain exact byte locations
   * of the resources to fetch
   * @param options Options for reading the resources
   */
  static fetchResources<T extends Resource = Resource>(
    filepath: string,
    positions: ResourcePosition[],
    options?: PackageFileReadingOptions
  ): ResourceKeyPair<T>[] {
    return fetchResources(filepath, positions, options) as ResourceKeyPair<T>[];
  }

  /**
   * Asynchronously fetches specific resources from the file at the given
   * location. This method is incredibly fast, but requires an index to be used, 
   * which takes time to build up. Note that the filter and limit options will
   * be ignored.
   * 
   * NOTE: This function requires `@s4tk/plugin-bufferfromfile`, and will throw
   * if you do not have it installed.
   * 
   * @param filepath Absolute path to file to read as a package
   * @param positions Array containing objects that contain exact byte locations
   * of the resources to fetch
   * @param options Options for reading the resources
   */
  static async fetchResourcesAsync<T extends Resource = Resource>(
    filepath: string,
    positions: ResourcePosition[],
    options?: PackageFileReadingOptions
  ): Promise<ResourceKeyPair<T>[]> {
    return promisify(() => Package.fetchResources(filepath, positions, options));
  }

  /**
   * Returns an array of objects that can be used to quickly fetch specific
   * resources with `fetchResources()`. All ResourcePositions are returned with
   * a key.
   * 
   * NOTE: This function requires `@s4tk/plugin-bufferfromfile`, and will throw
   * if you do not have it installed.
   * 
   * @param filepath Absolute path to file to read as a package
   * @param options Options for reading the resources
   */
  static indexResources(
    filepath: string,
    options?: PackageFileReadingOptions
  ): ResourcePosition[] {
    return getResourcePositions(filepath, options);
  }

  /**
   * Asynchronously returns an array of objects that can be used to quickly
   * fetch specific resources with `fetchResources()`. All ResourcePositions are
   * returned with a key.
   * 
   * NOTE: This function requires `@s4tk/plugin-bufferfromfile`, and will throw
   * if you do not have it installed.
   * 
   * @param filepath Absolute path to file to read as a package
   * @param options Options for reading the resources
   */
  static async indexResourcesAsync(
    filepath: string,
    options?: PackageFileReadingOptions
  ): Promise<ResourcePosition[]> {
    return promisify(() => Package.indexResources(filepath, options));
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): Package<ResourceType> {
    return new Package<ResourceType>(this.entries.map(entry => entry.clone()));
  }

  /**
   * Compresses all XmlResources in this Package into CombinedTuningResources
   * (one per group) and deletes the originals.
   * 
   * Before using this method and potentially setting the game on fire, please
   * review [this post](https://www.patreon.com/posts/72110305) that explains
   * the risks of using combining tuning and how to do so responsibly.
   * 
   * It is of utmost importance that the provided creator/project names are
   * universally unique. These are not only used for the instance of the
   * combined tuning, but also for the seed that is used for node refs.
   * **IF YOU FAIL TO MAKE THESE UNIQUE, YOU WILL BREAK THE GAME.**
   * 
   * @param creator The creator of the project being combined
   * @param project The name of the project being combined
   * @param writeBinary Whether or not the combined tunings should be binary
   * @throws If any tunings in this Package were loaded raw
   */
  combineTuning(creator: string, project: string, writeBinary = false) {
    if (!(creator && project))
      throw new Error("Creator and project names must be non-empty.");

    const refSeed = fnv64(`${creator}_${project}:combinedTuning`);

    // organizing tunings by group
    const groupMap = new Map<number, ResourceEntry<XmlResource>[]>();
    this.entries.forEach(entry => {
      if (!(entry.key.type in TuningResourceType)) return;
      if (!groupMap.has(entry.key.group)) groupMap.set(entry.key.group, []);
      const tunings = groupMap.get(entry.key.group);
      tunings.push(entry as unknown as ResourceEntry<XmlResource>);
    });

    // creating/adding combined tunings
    groupMap.forEach((entries, group) => {
      const tunings = entries.map(entry => {
        this.delete(entry.id);
        return entry.value;
      });

      const combined = CombinedTuningResource.combine(tunings, group, refSeed, {
        writeBinary
      });

      const key = {
        type: BinaryResourceType.CombinedTuning,
        group: group,
        instance: fnv64(`${creator}_${project}:combinedTuning_${group}`)
      };

      this.add(key, combined as unknown as ResourceType);
    });
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

  protected _serialize(minify?: boolean): Buffer {
    return writeDbpf(this.entries, minify);
  }

  //#endregion Protected Methods
}
