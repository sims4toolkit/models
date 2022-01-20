import clone from "just-clone";
import compare from "just-compare";
import { deflateSync } from "zlib";
import type Sims4Package from "./sims4package";
import type Resource from "../resources/resource";
import { MappedModelEntry } from "../base/mappedModel";
import WritableModel from "../base/writableModel";
import { ResourceKey } from "./shared";

/**
 * An entry for a resource in a package file. This entry has a key and handles
 * compression of the buffer.
 */
export default class ResourceEntry extends WritableModel implements MappedModelEntry<ResourceKey, Resource> {
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
