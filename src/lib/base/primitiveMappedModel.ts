import CacheableModel from "./cacheableModel";
import { MappedModel, MappedModelEntry } from "./mappedModel";

/**
 * A mapped model that uses numbers for keys and some other primitive type for
 * its values.
 */
export abstract class PrimitiveMappedModel<Value, Entry extends PrimitiveEntry<Value>> extends MappedModel<number, Value, Entry> {
  protected _getKeyIdentifier(key: number): number {
    return key;
  }
}

/**
 * An entry in a PrimitiveMappedModel.
 */
export abstract class PrimitiveEntry<Value> extends CacheableModel implements MappedModelEntry<number, Value> {
  public owner?: PrimitiveMappedModel<Value, PrimitiveEntry<Value>>;
  private _key: number;

  get key(): number { return this._key; }
  set key(key: number) {
    const previous = this._key;
    this._key = key;
    this.owner?._onKeyUpdate(previous, key);
  }

  constructor(key: number, public value: Value, owner: PrimitiveMappedModel<Value, PrimitiveEntry<Value>>) {
    super(owner);
    this._key = key;
    this._watchProps("value");
  }

  equals(other: PrimitiveEntry<Value>): boolean {
    return this.keyEquals(other?.key) && this.value === other?.value;
  }

  keyEquals(key: number): boolean {
    return this.key === key;
  }
}
