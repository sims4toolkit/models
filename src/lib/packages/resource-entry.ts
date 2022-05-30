import clone from "just-clone";
import compare from "just-compare";
import type Resource from "../resources/resource";
import type Package from "./package";
import type { ResourceKey } from "./types";
import { MappedModelEntry } from "../base/mapped-model";
import DataType from "../enums/data-type";
import ApiModelBase from "../base/api-model";

/**
 * An entry for a resource in a package file. This is just a pairing of a
 * key and a resource.
 */
export default class ResourceEntry<ResourceType extends Resource = Resource>
  extends ApiModelBase implements MappedModelEntry<ResourceKey, ResourceType> {

  public owner?: Package<ResourceType>;
  readonly id: number;
  private _key: ResourceKey;
  private _resource: ResourceType;

  get key(): ResourceKey { return this._key; }
  set key(key: ResourceKey) {
    const onChange = (
      owner: Package,
      target: ResourceKey,
      property: string,
      previous: any
    ) => {
      const old = clone(target);
      old[property] = previous;
      owner?._onKeyUpdate(old, target);
    };

    if (this._key) this.owner?._onKeyUpdate(this._key, key);
    this._key = this._getCollectionProxy(key, onChange);
  }

  /** The resource in this entry. */
  get value(): ResourceType { return this._resource; }
  set value(resource: ResourceType) {
    if (resource) resource.owner = this;
    this._resource = resource;
    this.onChange();
  }

  /** Alias for `this.value` for readability. */
  get resource(): ResourceType { return this.value; }
  set resource(resource: ResourceType) { this.value = resource; }

  constructor(
    key: ResourceKey,
    resource: ResourceType,
    owner?: Package<ResourceType>
  ) {
    super(owner);
    this.key = key;
    if (resource) resource.owner = this;
    this._resource = resource;
    // key and value are watched manually in their setters
  }

  clone(): ResourceEntry<ResourceType> {
    return new ResourceEntry<ResourceType>(
      clone(this.key),
      this.value.clone() as ResourceType
    );
  }

  equals(other: ResourceEntry<ResourceType>): boolean {
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

  valueEquals(value: ResourceType): boolean {
    return this.value.equals(value);
  }

  protected _getCollectionOwner(): Package<ResourceType> {
    return this.owner;
  }
}
