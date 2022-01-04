import CacheableModel from "../../../dst/lib/models/abstract/cacheableModel";

export default class MockOwner extends CacheableModel {
  private _cached: boolean;

  get cached() { return this._cached; }

  constructor() {
    super();
    this._cached = true;
  }

  uncache(): void {
    this._cached = false;
  }
}
