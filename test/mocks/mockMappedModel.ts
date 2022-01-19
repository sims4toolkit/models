import CacheableModel from "../../dst/lib/base/cacheableModel";
import { PrimitiveMappedModel, PrimitiveEntry } from "../../dst/lib/base/primitiveMappedModel";

export default class MockMappedModel extends PrimitiveMappedModel<string, MockEntry> {
  constructor(entries: { key: number; value: string; }[] = [], owner?: CacheableModel) {
    super(entries, { owner });
  }

  clone(): CacheableModel {
    throw new Error("Method not implemented.");
  }

  equals(other: any): boolean {
    throw new Error("Method not implemented.");
  }

  protected _makeEntry(key: number, value: string): MockEntry {
    return new MockEntry(key, value, this);
  }

  protected _serialize(): Buffer {
    throw new Error("Method not implemented.");
  }
}

class MockEntry extends PrimitiveEntry<string> {
  constructor(key: number, public value: string, owner: MockMappedModel) {
    super(key, value, owner);
  }
  
  clone(): CacheableModel {
    throw new Error("Method not implemented.");
  }
}
