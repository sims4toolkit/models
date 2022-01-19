import { deflateSync } from "zlib";
import clone from "just-clone";
import compare from "just-compare";
import type Resource from "../resources/resource";
import type CacheableModel from "../abstract/cacheableModel";
import type { DbpfHeader, ResourceKey, ResourceKeyPair } from "./shared";
import type { SerializationOptions } from "../shared";
import WritableModel from "../abstract/writableModel";
import { MappedModel, MappedModelEntry } from "../abstract/mappedModel";
import { arraysAreEqual } from "../helpers";
import readDbpf from "./serialization/readDbpf";
import writeDbpf from "./serialization/writeDbpf";

/**
 * Model for a Sims 4 package file (also called a "Database Packed File", or
 * DBPF for short).
 */
export default class Sims4Package extends MappedModel<ResourceKey, Resource, ResourceEntry> {
  private _header?: DbpfHeader;

  /**
   * Meta information about this package. WARNING: Editing either `fileVersion`
   * or `userVersion` will not call `uncache()`. This must be done manually.
   * Though, you shouldn't be editing these values anyways... so, if something
   * goes wrong, it's on you, champ.
   */
  get header() { return this._header ??= {}; }
  private set header(header: DbpfHeader) {
    this.header = header ? this._getCollectionProxy(header) : header;
  }

  //#region Initialization

  protected constructor(header: DbpfHeader, entries: ResourceKeyPair[], buffer?: Buffer, owner?: CacheableModel) {
    super(entries, { buffer, owner });
    this.header = header;
  }

  /**
   * Creates a new Sims4Package instance from the given header and entries. Both
   * arguments are optional, and if left out, will create an empty package.
   * 
   * Arguments:
   * - `header`: Values to use in the header of this package. Empty by default.
   * - `entries`: Resource entries to use in this package. Empty by default.
   * 
   * @param args Arguments for creation
   */
  static create({ header = {}, entries = [] }: {
    header?: DbpfHeader;
    entries?: ResourceKeyPair[];
  } = {}): Sims4Package {
    return new Sims4Package(header, entries);
  }

  /**
   * Reads the given buffer as a Sims4Package.
   * 
   * @param buffer Buffer to read as a package
   * @param options Options for reading the buffer
   */
  static from(buffer: Buffer, options?: SerializationOptions): Sims4Package {
    const dto = readDbpf(buffer, options);
    return new Sims4Package(dto.header, dto.entries, buffer);
  }

  //#endregion Initialization

  //#region Public Methods

  clone(): Sims4Package {
    const buffer = this.hasChanged ? undefined : this.buffer;
    return new Sims4Package(clone(this.header), this.entries, buffer);
  }

  equals(other: Sims4Package): boolean {
    return compare(this.header, other?.header)
      && arraysAreEqual(this.entries, other?.entries);
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
    return writeDbpf(this);
  }

  //#endregion Protected Methods
}

/**
 * An entry for a resource in a package file. This entry has a key and handles
 * compression of the buffer.
 */
class ResourceEntry extends WritableModel implements MappedModelEntry<ResourceKey, Resource> {
  public owner: Sims4Package;
  private _key: ResourceKey;
  private _resource: Resource;

  get key(): ResourceKey { return this._key; }
  set key(key: ResourceKey) {
    const owner = this._getCollectionOwner();
    const onChange = (target: ResourceKey, property: string, previous: any) => {
      const old = clone(target);
      old[property] = previous;
      owner.onKeyUpdate(old, target);
    };

    if (this._key) owner.onKeyUpdate(this._key, key);
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
