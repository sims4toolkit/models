/**
 * Base for models that either can be cached or are part of another model that
 * can be cached. They may have an owning model that needs to be notified when
 * they are changed.
 */
export default abstract class CacheableModel {
  private _cachedProps: string[] = [];

  constructor(public owner?: CacheableModel) {
    this._cachedProps = [];

    return new Proxy(this, {
      set(target: CacheableModel, property: string, value: any) {
        const ref = Reflect.set(target, property, value);
        if (target._cachedProps.includes(property)) target.uncache();
        return ref;
      }
    });
  }

  /**
   * Uncaches this model and notifies its owner (if it has one) to do the same.
   */
  uncache() {
    this.owner?.uncache();
  }

  /**
   * Watches the properties with the given names for changes. When they change,
   * this model is uncached.
   * 
   * @param propNames Names of props that should be watched for changes
   */
  protected _watchProps(...propNames: string[]) {
    this._cachedProps.push(...propNames);
  }
}
