import type StringTableResource from "./stbl-resource";
import { PrimitiveEntry } from "../../base/primitive-mapped-model";
import DataType from "../../enums/data-type";

/**
 * An entry in a StringTableResource.
 */
export default class StringEntry extends PrimitiveEntry<string> {
  /** Alias for `this.value` for readability. */
  get string(): string { return this.value; }
  set string(string: string) {
    this.value = string;
    this.onChange();
  }

  constructor(key: number, value: string, owner?: StringTableResource) {
    super(key, value, owner);
  }

  clone(): StringEntry {
    return new StringEntry(this.key, this.value);
  }

  validate(): void {
    if (!DataType.isNumberInRange(this.key, DataType.UInt32))
      throw new Error(`Expected string entry's key to be a UInt32, got ${this.key}`);
  }
}
