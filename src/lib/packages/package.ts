import clone from "just-clone";
import compare from "just-compare";
import { deflateSync } from "zlib";
import type Resource from "../resources/resource";
import type { ResourceKey, ResourceKeyPair } from "./types";
import type { SerializationOptions } from "../shared";
import { MappedModel, MappedModelEntry } from "../base/mapped-model";
import { arraysAreEqual } from "../utils/helpers";
import readDbpf, { readTuningTypes, extractFiles } from "./serialization/read-dbpf";
import writeDbpf from "./serialization/write-dbpf";
import WritableModel from "../base/writable-model";

/**
 * Model for a Sims 4 package file (also called a "Database Packed File", or
 * DBPF for short).
 */
export default class Sims4Package extends MappedModel<ResourceKey, Resource, ResourceEntry> {
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
  static create(entries: ResourceKeyPair[] = []): Sims4Package {
    return new Sims4Package(entries);
  }

  /**
   * Reads the given buffer as a DBPF to extract unique tuning types from. Types
   * are returned in a map (and mutated in the given map, if applicable) from
   * their hash to their name.
   * 
   * @param buffer Buffer of DBPF to read types from
   * @param baseMap Map to add type hash/name pairs to
   */
  static determineTuningTypes(buffer: Buffer, baseMap?: Map<number, string>): Map<number, string> {
    return readTuningTypes(buffer, baseMap);
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
  static from(buffer: Buffer, options?: SerializationOptions): Sims4Package {
    try {
      return new Sims4Package(readDbpf(buffer, options), buffer);
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

  clone(): Sims4Package {
    const buffer = this.hasChanged ? undefined : this.buffer;
    const entryClones = this.entries.map(entry => entry.clone());
    return new Sims4Package(entryClones, buffer);
  }

  equals(other: Sims4Package): boolean {
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

/**
 * An entry for a resource in a package file. This entry has a key and handles
 * compression of the buffer.
 */
class ResourceEntry extends WritableModel implements MappedModelEntry<ResourceKey, Resource> {
  public owner?: Sims4Package;
  private _key: ResourceKey;
  private _resource: Resource;

  get key(): ResourceKey { return this._key; }
  set key(key: ResourceKey) {
    const onChange = (owner: Sims4Package, target: ResourceKey, property: string, previous: any) => {
      const old = clone(target);
      old[property] = previous;
      owner?._onKeyUpdate(old, target);
    };

    if (this._key) this.owner?._onKeyUpdate(this._key, key);
    this._key = this._getCollectionProxy(key, onChange);
  }

  /** The resource in this entry. */
  get value(): Resource { return this._resource; }
  set value(resource: Resource) {
    if (resource) resource.owner = this;
    this._resource = resource;
    this.uncache();
  }

  /** Alias for `this.value` for readability. */
  get resource(): Resource { return this.value; }
  set resource(resource: Resource) { this.value = resource; }
  
  constructor(key: ResourceKey, resource: Resource, buffer?: Buffer, owner?: Sims4Package) {
    super({ owner, buffer });
    this.key = key;
    if (resource) resource.owner = this;
    this._resource = resource;
    // key and value are watched manually in their setters
  }

  clone(): ResourceEntry {
    return new ResourceEntry(clone(this.key), this.value.clone());
  }

  equals(other: ResourceEntry): boolean {
    return this.keyEquals(other?.key) && this.value.equals(other?.value);
  }

  keyEquals(key: ResourceKey): boolean {
    return compare(this.key, key);
  }

  validate(): void {
    if (this.key.type < 0 || this.key.type > 0xFFFFFFFF)
      throw new Error(`Expected type to be a UInt32, got ${this.key.type}`);
    if (this.key.group < 0 || this.key.group > 0xFFFFFFFF)
      throw new Error(`Expected group to be a UInt32, got ${this.key.group}`);
    if (this.key.instance < 0n || this.key.instance > 0xFFFFFFFFFFFFFFFFn)
      throw new Error(`Expected instance to be a UInt64, got ${this.key.instance}`);
    this.value.validate();
  }

  protected _getCollectionOwner(): Sims4Package {
    return this.owner;
  }

  protected _serialize(): Buffer {
    return deflateSync(this.value.buffer);
  }
}
