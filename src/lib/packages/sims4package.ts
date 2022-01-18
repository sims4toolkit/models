import type { DbpfDto, DbpfHeader, ResourceEntryDto, ResourceKeyDto } from './shared';
import type { SerializationOptions } from '../shared';
import type Resource from '../resources/resource';
import zlib from "zlib";
import clone from 'just-clone';
import WritableModel from "../abstract/writableModel";
import readDbpf from './serialization/readDbpf';
import writeDbpf from './serialization/writeDbpf';
import CacheableModel from '../abstract/cacheableModel';
import { formatResourceGroup, formatResourceInstance, formatResourceType } from '@s4tk/hashing/formatting';
import { removeFromArray } from '../helpers';


/**
 * Model for a Sims 4 package file (also called a "Database Packed File", or
 * DBPF for short).
 */
export default class Sims4Package extends WritableModel implements DbpfDto {
  private _nextId: number;
  private _header?: DbpfHeader;
  private _entries: ResourceEntry[];

  /**
   * Meta information about this package. WARNING: Editing either `fileVersion`
   * or `userVersion` will not call `uncache()`. This must be done manually.
   * Though, you shouldn't be editing these values anyways... so, if something
   * goes wrong, it's on you, champ.
   */
  get header() { return this._header ??= {}; }
  private set header(header: DbpfHeader) {
    if (header) {
      this.header = this._getCollectionProxy(header);
    } else {
      this.header = header;
    }
  }

  /**
   * An array that contains the entries for this package. Mutating this array
   * and its contents is safe in terms of cacheing, however, you should not be
   * pushing entries here yourself. Use the `add()` method, so that IDs are
   * guaranteed to be unique.
   */
  get entries() { return this._entries; }
  private set entries(entries: ResourceEntry[]) {
    const owner = this._getCollectionOwner() as Sims4Package;
    entries.forEach(entry => entry.owner = owner);
    this._entries = this._getCollectionProxy(entries);
  }

  /** Shorthand for `entries.length`. */
  get length(): number { return this.entries.length; }

  //#region Initialization

  protected constructor(header: DbpfHeader, entries: ResourceEntryDto[], buffer?: Buffer) {
    super({ buffer });
    this.header = header;
    this.entries = entries.map((entry, id) => {
      const key = ResourceKey.from(entry.key, this);
      return new ResourceEntry(id, key, entry.resource, this, entry.buffer);
    });
    this._nextId = this.length;
  }

  /**
   * Returns a deep copy of this package.
   */
  clone(): Sims4Package {
    // FIXME: this is ineffcient because it's just going to loop again
    return new Sims4Package(clone(this.header), this.entries.map(entry => ({
      key: entry.key.clone(),
      resource: entry.resource.clone(),
      buffer: entry.hasChanged ? undefined : entry.buffer
    })));
  }

  // TODO: combine()

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
    entries?: ResourceEntryDto[];
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

  /**
   * Creates an entry for the given key and resource, adds it to the package,
   * and returns it. If the given key already exists in the package (by value
   * equality), an exception is thrown.
   * 
   * Options
   * - `allowDuplicateKey`: If `true`, then the function will not throw when
   * adding a key that already exists. (Default = `false`)
   * 
   * @param key Key to use for the resource
   * @param resource Resource to add
   * @param options Object containing options 
   * @returns Resource entry that was added
   * @throws If the key already exists
   */
  add(key: ResourceKeyDto, resource: Resource, { allowDuplicateKey = false } = {}): ResourceEntry {
    if (!allowDuplicateKey) {
      const entry = this.getByKey(key);
      throw new Error(`Tried to add key that already exists: ${entry.key.format()}`);
    }

    const entry = new ResourceEntry(this._nextId++, ResourceKey.from(key), resource, this);
    this.entries.push(entry);
    return entry;
  }

  // TODO: addAndGenerateKey

  // TODO: equals

  // TODO: findErrors

  /**
   * Finds and returns the index of the given entry.
   * 
   * @param entry Entry to find index of
   */
  findIndex(entry: ResourceEntry): number {
    return this.entries.findIndex(e => e.id === entry.id);
  }

  /**
   * Finds and returns the entry with the given ID.
   * 
   * @param id Id of entry to find
   */
  getById(id: number): ResourceEntry {
    return this.entries.find(entry => entry.id === id);
  }

  /**
   * Finds and returns the entry with the given key. If there is more than one
   * entry with the key, the first is returned.
   * 
   * @param key Key of entry to find
   */
  getByKey(key: ResourceKeyDto): ResourceEntry {
    return this.entries.find(entry => entry.key.equals(key));
  }

  /**
   * Adds all entries from all given packages into this one. Entries are
   * cloned and are given new IDs relative to this table.
   * 
   * @param dbpfs Packages to add entries from
   */
  merge(...dbpfs: Sims4Package[]) {
    dbpfs.forEach(dbpf => {
      dbpf.entries.forEach(entry => {
        this.add(entry.key.clone(), entry.resource.clone());
      });
    });
  }

  /**
   * Removes any number of entries from this package. If just removing one
   * entry, consider calling its `delete()` method.
   * 
   * @param entries Entries to remove from this package
   */
  remove(...entries: ResourceEntry[]) {
    removeFromArray(entries, this.entries);
  }

  //#endregion Public Methods

  //#region Protected Methods

  protected _serialize(): Buffer {
    return writeDbpf(this);
  }

  //#endregion Protected Methods
}

/**
 * A resource in a Sims4Package that has a resource key.
 */
class ResourceEntry extends WritableModel implements ResourceEntryDto {
  public owner?: Sims4Package;
  private _key: ResourceKey;
  private _resource: Resource;

  /**
   * The key for this entry. Ideally, every resource should have a unique key,
   * but this is not necessarily guaranteed. For a truly unique, non-changing
   * identifier, use the `id` property.
   */
  get key() { return this._key; }
  set key(key: ResourceKey) {
    this._key = key;
    if (key) key.owner = this.owner; // owner b/c no effect on buffer
  }

  /** The resource in this entry. */
  get resource() { return this._resource; }
  set resource(resource: Resource) {
    this._resource = resource;
    if (resource) resource.owner = this;
  }

  constructor(public readonly id: number, key: ResourceKey, resource: Resource, owner: Sims4Package, buffer?: Buffer) {
    super({ buffer, owner });
    this.key = key;
    this.resource = resource;
    this._watchProps('key', 'resource');
  }

  /**
   * Removes this entry from the package that owns it.
   */
  delete() {
    this.owner?.remove(this);
  }

  equals(other: ResourceEntry): boolean {
    if (!(other instanceof ResourceEntry)) return false;
    return this.key.equals(other.key) && this.resource.equals(other.resource);
  }

  protected _serialize(): Buffer {
    return zlib.deflateSync(this.resource.buffer);
  }
}

/**
 * The (ideally) unique identifier for a resource in a package.
 */
class ResourceKey extends CacheableModel implements ResourceKeyDto {
  public owner?: Sims4Package;

  constructor(public type: number, public group: number, public instance: bigint, owner?: Sims4Package) {
    super(owner);
    this._watchProps('type', 'group', 'instance');
  }

  static from({ type, group, instance }: ResourceKeyDto, owner?: Sims4Package): ResourceKey {
    return new ResourceKey(type, group, instance, owner);
  }

  clone(): ResourceKey {
    return ResourceKey.from(this);
  }

  equals(other: ResourceKeyDto): boolean {
    if (!other) return false;
    return this.type === other.type &&
           this.group === other.group &&
           this.instance === other.instance;
  }

  /**
   * Returns the type, group, and instance formatted as a string with the given
   * delimeter (':' by default).
   * 
   * @param delimeter Character to use to separate type, group, and instance
   */
  format(delimeter = ':'): string {
    return `${formatResourceType(this.type)}${delimeter}${formatResourceGroup(this.type)}${delimeter}${formatResourceInstance(this.instance)}`;
  }
}
