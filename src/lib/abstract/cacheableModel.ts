/** An object that contains a collection of CacheableModels. */
type CachedCollection = { [key: string]: CacheableModel; } | CacheableModel[];

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
   * Returns the owner to use for collections that this model contains. By
   * default, the owner is `this`. This function is necessary to avoid using
   * `this` in proxy traps.
   */
  protected _getCollectionOwner(): CacheableModel {
    return this;
  }

  /**
   * Returns a proxy that listens for changes in CachedCollections that this
   * model contains.
   * 
   * @param obj CachedCollection to get proxy for
   */
  protected _getCollectionProxy<T extends CachedCollection>(obj: T): T {
    //@ts-expect-error TS doesn't know about _isProxy
    if (obj._isProxy) return obj;

    // can't use `this` within the Proxy traps or else it means something else
    const getOwner = () => this._getCollectionOwner();

    return new Proxy(obj, {
      set(target, property, value) {
        const ref = Reflect.set(target, property, value);
        const owner = getOwner();
        if (value instanceof CacheableModel) value.owner = owner;
        owner?.uncache();
        return ref;
      },
      get(target, property) {
        if (property === "_isProxy") return true;
        return Reflect.get(target, property);
      },
      deleteProperty(target, property) {
        const ref = Reflect.deleteProperty(target, property);
        getOwner()?.uncache();
        return ref;
      }
    });
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
