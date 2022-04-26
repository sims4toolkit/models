import ApiModelBase from "../../dst/lib/base/api-model";

/**
 * A bare-bones implementation of an API model that can own another one.
 */
export default class MockOwner extends ApiModelBase {
  private _cached: boolean;

  get cached() { return this._cached; }

  constructor() {
    super();
    this._cached = true;
  }

  clone(): ApiModelBase {
    throw new Error("Method not implemented.");
  }

  equals(other: any): boolean {
    throw new Error("Method not implemented.");
  }

  onChange(): void {
    this._cached = false;
  }
}
