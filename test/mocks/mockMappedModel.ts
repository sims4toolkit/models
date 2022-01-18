import CacheableModel from "../../dst/lib/abstract/cacheableModel";
import { MappedModel, MappedModelEntry } from "../../dst/lib/abstract/mappedModel";

class MockMappedModelEntry extends CacheableModel implements MappedModelEntry<number, string> {
  public owner: MockMappedModel;
  private _key: number;
  private _value: string;

  get key(): number { return this._key; }
  set key(key: number) {
    const previous = this._key;
    this._key = key;
    this.owner.onKeyUpdate(previous, key);
  }

  get value(): string { return this._value; }
  set value(value: string) {
    this._value = value;
    this.uncache();
  }

  constructor(key: number, value: string, owner: MockMappedModel) {
    super(owner);
    this._key = key;
    this._value = value;
  }

  keyEquals(key: number): boolean {
    return this.key === key;
  }
}

export default class MockMappedModel extends MappedModel<number, string, MockMappedModelEntry> {
  constructor(entries: { key: number; value: string; }[], owner?: CacheableModel) {
    super(entries, { owner });
  }

  protected _getKeyIdentifier(key: number): string | number {
    return key;
  }

  protected _makeEntry(key: number, value: string): MockMappedModelEntry {
    return new MockMappedModelEntry(key, value, this);
  }

  protected _serialize(): Buffer {
    throw new Error("Method not implemented.");
  }
}
