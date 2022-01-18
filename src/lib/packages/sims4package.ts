import type { DbpfDto, DbpfHeader, ResourceEntryDto, ResourceKey } from './shared';
import type { SerializationOptions } from '../shared';
import type Resource from '../resources/resource';
import WritableModel from "../abstract/writableModel";
import readDbpf from './serialization/readDbpf';
import writeDbpf from './serialization/writeDbpf';


/**
 * Model for a Sims 4 package file (also called a "Database Packed File", or
 * DBPF for short).
 */
export default class Sims4Package extends WritableModel implements DbpfDto {
  private _nextId: number;
  private _entries: ResourceEntry[];
  private _header?: DbpfHeader;

  /** TODO: */
  get header() { return this._header ??= {}; }
  private set header(header: DbpfHeader) {
    // FIXME: issue with versions, if they're changed, nothing is notified
    if (header) this.header = this._getCollectionProxy(header);
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

  protected constructor(header: DbpfHeader, entries: ResourceEntryDto[], buffer?: Buffer) {
    super({ buffer });
    this.header = header;
    this.entries = entries.map((entry, id) => {
      return new ResourceEntry(id, entry.key, entry.resource, this, entry.buffer);
    });
    this._nextId = this.length;
  }

  /**
   * TODO:
   */
  static create(entries: {
    key: ResourceKey;
    resource: Resource;
  }[] = []): Sims4Package {
    return new Sims4Package(undefined, entries);
  }

  /**
   * TODO:
   */
  static from(buffer: Buffer, options?: SerializationOptions): Sims4Package {
    const dto = readDbpf(buffer, options);
    return new Sims4Package(dto.header, dto.entries, buffer);
  }

  protected _serialize(): Buffer {
    return writeDbpf(this);
  }
}

/**
 * TODO:
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
    this._key = this._getCollectionProxy(key);
  }

  /** The resource in this entry. */
  get resource() { return this._resource; }
  set resource(resource: Resource) {
    this._resource = resource;
    // intentionally using `this` instead of collection owner
    if (resource) resource.owner = this;
  }

  constructor(public readonly id: number, key: ResourceKey, resource: Resource, owner: Sims4Package, buffer?: Buffer) {
    super({ buffer, owner });
    this.key = key;
    this.resource = resource;
    this._watchProps('key', 'resource');
  }

  protected _getCollectionOwner(): Sims4Package {
    return this.owner;
  }

  protected _serialize(): Buffer {
    // TODO: compress buffer
    const compressedBuffer = this.resource.buffer;
    return compressedBuffer;
  }
}
