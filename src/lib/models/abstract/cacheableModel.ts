/**
 * Base class for models that either can be cached or are part of another model
 * that can be cached. They may have an owning model that needs to be notified
 * when they are changed.
 */
export default abstract class CacheableModel {
  private _cachedProps: string[] = [];

  constructor(public owner?: CacheableModel) {
    this._cachedProps = [];

    return new Proxy(this, {
      set(target: CacheableModel, property: string, value: any) {
        const prev: any = target[property];
        const ref = Reflect.set(target, property, value);
        if (property === 'owner') target._onOwnerChange(prev);
        if (target._cachedProps.includes(property)) target.uncache();
        return ref;
      },
      deleteProperty(target: CacheableModel, property: string) {
        const prev: any = target[property];
        const ref = Reflect.deleteProperty(target, property);
        if (property === 'owner') target._onOwnerChange(prev);
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
   * Called when an object sets this one as its owner.
   * 
   * @param child The child that was added
   */
  protected _onChildAdd(child: CacheableModel) {}

  /**
   * Called when an object removed this one as its owner.
   * 
   * @param child The child that was removed
   */
  protected _onChildRemove(child: CacheableModel) {}

  /**
   * Called after setting the owner of this model.
   * 
   * @param previousOwner The previous owner of this model
   */
  protected _onOwnerChange(previousOwner: CacheableModel) {
    if (previousOwner === this.owner) return;
    previousOwner?._onChildRemove(this);
    this.owner?._onChildAdd(this);
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
