import clone from "just-clone";
import compare from "just-compare";
import type Resource from "../resources/resource";
import type Package from "./package";
import type { ResourceKey } from "./types";
import WritableModel from "../base/writable-model";
import { MappedModelEntry } from "../base/mapped-model";
import DataType from "../enums/data-type";
import compressBuffer from "../compression/compress";

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
    this.onChange();
  }

  /** Alias for `this.value` for readability. */
  get resource(): Resource { return this.value; }
  set resource(resource: Resource) { this.value = resource; }
  
  constructor(
    key: ResourceKey,
    resource: Resource,
    saveBuffer?: boolean,
    buffer?: Buffer,
    owner?: Package
  ) {
    super(saveBuffer, buffer, owner);
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
    if (!DataType.isNumberInRange(this.key.type, DataType.UInt32))
      throw new Error(`Expected type to be a UInt32, got ${this.key.type}`);
    if (!DataType.isNumberInRange(this.key.group, DataType.UInt32))
      throw new Error(`Expected group to be a UInt32, got ${this.key.group}`);
    if (!DataType.isBigIntInRange(this.key.instance, DataType.UInt64))
      throw new Error(`Expected instance to be a UInt64, got ${this.key.instance}`);
    this.value.validate();
  }

  valueEquals(value: Resource): boolean {
    return this.value.equals(value);
  }

  protected _getCollectionOwner(): Package {
    return this.owner;
  }

  protected _serialize(): Buffer {
    if (this.resource.isCompressed) {
      return this.resource.buffer;
    } else {
      return compressBuffer(this.resource.buffer, this.resource.compressionType);
    }
  }
}
