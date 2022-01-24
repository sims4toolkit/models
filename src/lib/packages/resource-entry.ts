import clone from "just-clone";
import compare from "just-compare";
import { deflateSync } from "zlib";
import type Resource from "../resources/resource";
import type Package from "./package";
import type { ResourceKey } from "./types";
import WritableModel from "../base/writable-model";
import { MappedModelEntry } from "../base/mapped-model";

/**
 * An entry for a resource in a package file. This entry has a key and handles
 * compression of the buffer.
 */
export default class ResourceEntry extends WritableModel implements MappedModelEntry<ResourceKey, Resource> {
  public owner?: Package;
  private _key: ResourceKey;
  private _resource: Resource;

  get key(): ResourceKey { return this._key; }
  set key(key: ResourceKey) {
    const onChange = (owner: Package, target: ResourceKey, property: string, previous: any) => {
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
  
  constructor(key: ResourceKey, resource: Resource, buffer?: Buffer, owner?: Package) {
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

  protected _getCollectionOwner(): Package {
    return this.owner;
  }

  protected _serialize(): Buffer {
    return deflateSync(this.value.buffer);
  }
}
