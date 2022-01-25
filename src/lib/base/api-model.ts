/** An object or array to listen for changes in within an ApiModelBase. */
type CachedCollection = { [key: string]: any; } | any[];

/**
 * Base class for all other models in the API. This model covers functionality
 * for parent-child (or owner-child) relationships, and notifying the owning
 * model when anything in the child has changed.
 */
export default abstract class ApiModelBase {
  private _watchedProps: string[];
  private _proxy: any;

  protected constructor(public owner?: ApiModelBase) {
    this._watchedProps = [];

    this._proxy = new Proxy(this, {
      set(target: ApiModelBase, property: string, value: any) {
        const prev: any = target[property];
        const ref = Reflect.set(target, property, value);
        if (property === 'owner') target._onOwnerChange(prev);
        if (target._watchedProps.includes(property)) target.uncache();
        return ref;
      },
      deleteProperty(target: ApiModelBase, property: string) {
        const prev: any = target[property];
        const ref = Reflect.deleteProperty(target, property);
        if (property === 'owner') target._onOwnerChange(prev);
        if (target._watchedProps.includes(property)) target.uncache();
        return ref;
      }
    });

    return this._proxy;
  }

  //#endregion Public Methods

  /**
   * Returns a deep copy of this model with the same public properties (except
   * for its owner). Internal or private values are not guaranteed to be
   * preserved.
   */
  abstract clone(): ApiModelBase;

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
   * Returns the owner to use for collections that this model contains.
   */
  protected _getCollectionOwner(): ApiModelBase {
    return this._proxy;
  }

  /**
   * Returns a proxy that listens for changes in CachedCollections.
   * 
   * @param obj CachedCollection to get proxy for
   */
  protected _getCollectionProxy<T extends CachedCollection>(
    obj: T, 
    onChange?: (owner: ApiModelBase, target: T, property: string | symbol, previous: any, current?: any) => void
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
          if (value instanceof ApiModelBase) value.owner = owner;
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
  protected _onChildAdd(child: ApiModelBase) {}

  /**
   * Called when an object removed this one as its owner.
   * 
   * @param child The child that was removed
   */
  protected _onChildRemove(child: ApiModelBase) {}

  /**
   * Called after setting the owner of this model.
   * 
   * @param previousOwner The previous owner of this model
   */
  protected _onOwnerChange(previousOwner: ApiModelBase) {
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
    this._watchedProps.push(...propNames);
  }

  //#endregion Protected Methods
}
