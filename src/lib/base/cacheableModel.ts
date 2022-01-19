/** An object or array that can be cached within a cacheable model. */
type CachedCollection = { [key: string]: any; } | any[];

/**
 * Base class for models that either can be cached or are part of another model
 * that can be cached. They may have an owning model that needs to be notified
 * when they are changed.
 */
export default abstract class CacheableModel {
  private _cachedProps: string[] = [];
  private _proxy: any;
  private _children: Set<CacheableModel>;

  protected constructor(public owner?: CacheableModel) {
    this._cachedProps = [];
    this._children = new Set();

    this._proxy = new Proxy(this, {
      set(target: CacheableModel, property: string, value: any) {
        const prev: any = target[property];
        const ref = Reflect.set(target, property, value);
        if (property === 'owner') target._onOwnerChange(prev);
        else if (target._cachedProps.includes(property)) target.uncache();
        return ref;
      },
      deleteProperty(target: CacheableModel, property: string) {
        const prev: any = target[property];
        const ref = Reflect.deleteProperty(target, property);
        if (property === 'owner') target._onOwnerChange(prev);
        else if (target._cachedProps.includes(property)) target.uncache();
        return ref;
      }
    });

    return this._proxy;
  }

  //#endregion Public Methods

  /**
   * Returns a deep copy of this model, containing all of the same public
   * properties that this model has, except for its owner. Internal values (such
   * as IDs) are not guaranteed to be preserved.
   */
  abstract clone(): CacheableModel;

  /**
   * Uncaches this model, its owner, and all of its children. Use of this method
   * if not recommended, as it defeats the purpose of cacheing at all. However,
   * it is available for use in case there is a bug with cacheing that you
   * cannot otherwise work around.
   */
  deepUncache() {
    this.uncache();
    this._children.forEach(child => {
      child.deepUncache();
    });
  }

  /**
   * Determines whether this model is equivalent to another object.
   * 
   * @param other Object to compare this model
   */
  abstract equals(other: any): boolean;

  /**
   * Uncaches this model and notifies its owner (if it has one) to do the same.
   * Note that this will NOT uncache this object's children.
   */
  uncache() {
    this.owner?.uncache();
  }

  /**
   * Verifies that this model is valid. If it isn't, a detailed exception is
   * thrown to explain what is wrong. If nothing is wrong, no exception is
   * thrown.
   * 
   * @throws If this model is invalid
   */
  validate(): void {};

  //#endregion Public Methods

  //#region Protected Methods

  /**
   * Returns the owner to use for collections that this model contains. By
   * default, the owner is `this`. This function is necessary to avoid using
   * `this` in proxy traps.
   */
  protected _getCollectionOwner(): CacheableModel {
    return this._proxy;
  }

  /**
   * Returns a proxy that listens for changes in CachedCollections.
   * 
   * @param obj CachedCollection to get proxy for
   */
  protected _getCollectionProxy<T extends CachedCollection>(
    obj: T, 
    onChange?: (owner: CacheableModel, target: T, property: string | symbol, previous: any, current?: any) => void
  ): T {
    //@ts-expect-error TS doesn't know about _isProxy
    if (obj._isProxy) return obj;

    // can't use `this` within the Proxy traps
    const getOwner = () => this._getCollectionOwner();

    return new Proxy(obj, {
      set(target, property, value) {
        const previous = target[property];
        const ref = Reflect.set(target, property, value);
        if (property !== "owner") {
          const owner = getOwner();
          onChange?.(owner, target, property, previous, value);
          if (value instanceof CacheableModel) value.owner = owner;
          owner?.uncache();
        }
        return ref;
      },
      get(target, property) {
        if (property === "_isProxy") return true;
        return Reflect.get(target, property);
      },
      deleteProperty(target, property) {
        const previous = target[property];
        const ref = Reflect.deleteProperty(target, property);
        if (property !== "owner") {
          const owner = getOwner();
          onChange?.(owner, target, property, previous);
          owner?.uncache();
        }
        return ref;
      }
    });
  }

  /**
   * Called when an object sets this one as its owner.
   * 
   * @param child The child that was added
   */
  protected _onChildAdd(child: CacheableModel) {
    this._children.add(child);
  }

  /**
   * Called when an object removed this one as its owner.
   * 
   * @param child The child that was removed
   */
  protected _onChildRemove(child: CacheableModel) {
    this._children.delete(child);
  }

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

  //#endregion Protected Methods
}
