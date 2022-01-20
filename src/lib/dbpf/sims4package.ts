import clone from "just-clone";
import compare from "just-compare";
import { deflateSync } from "zlib";
import type Resource from "../resources/resource";
import type CacheableModel from "../base/cacheableModel";
import type { ResourceKey, ResourceKeyPair } from "./shared";
import type { SerializationOptions } from "../shared";
import { MappedModel, MappedModelEntry } from "../base/mappedModel";
import { arraysAreEqual } from "../helpers";
import readDbpf from "./serialization/readDbpf";
import writeDbpf from "./serialization/writeDbpf";
import WritableModel from "../base/writableModel";

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
  
  constructor(key: ResourceKey, resource: Resource, owner?: Sims4Package) {
    super({ owner });
    this.key = key;
    this.value = resource;
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

  protected _getCollectionOwner(): Sims4Package {
    return this.owner;
  }

  protected _serialize(): Buffer {
    return deflateSync(this.value.buffer);
  }
}
