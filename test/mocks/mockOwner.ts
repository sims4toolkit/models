import CacheableModel from "../../dst/lib/base/cacheableModel";

export default class MockOwner extends CacheableModel {
  private _cached: boolean;

  get cached() { return this._cached; }

  constructor() {
    super();
    this._cached = true;
  }

  clone(): CacheableModel {
    throw new Error("Method not implemented.");
  }
  
  equals(other: any): boolean {
    throw new Error("Method not implemented.");
  }

  uncache(): void {
    this._cached = false;
  }
}
