import type { DbpfDto, DbpfHeader, ResourceEntryDto, ResourceKeyDto } from './shared';
import type { SerializationOptions } from '../shared';
import type Resource from '../resources/resource';
import WritableModel from "../abstract/writableModel";
import readDbpf from './serialization/readDbpf';
import writeDbpf from './serialization/writeDbpf';
import CacheableModel from '../abstract/cacheableModel';


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

  // TODO:

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

  equals(other: ResourceEntry): boolean {
    if (!(other instanceof ResourceEntry)) return false;
    return this.key.equals(other.key) && this.resource.equals(other.resource);
  }

  protected _serialize(): Buffer {
    // TODO: compress buffer
    const compressedBuffer = this.resource.buffer;
    return compressedBuffer;
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

  equals(other: ResourceKey): boolean {
    if (!(other instanceof ResourceKey)) return false;
    return this.type === other.type &&
           this.group === other.group &&
           this.instance === other.instance;
  }
}
