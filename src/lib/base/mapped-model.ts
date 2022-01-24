import type CacheableModel from "./cacheable-model";
import WritableModel from "./writable-model";

/**
 * A base for writable models that contain mapped data.
 */
export abstract class MappedModel<Key, Value, Entry extends MappedModelEntry<Key, Value>> extends WritableModel {
  private readonly _entryMap: Map<number, Entry>;
  private readonly _keyMap: Map<number | string, number>;
  private _nextId: number;
  private _cachedEntries?: Entry[];

  /**
   * An iterable of the entries in this model. Note that mutating this iterable
   * will not update the model, but mutating individual entries will.
   */
  get entries(): Entry[] {
    return this._cachedEntries ??= [...this._entryMap.values()];
  }

  /**
   * The number of entries in this model.
   */
  get size(): number {
    return this._entryMap.size;
  }

  protected constructor(entries: { key: Key; value: Value; }[], options?: {
    buffer?: Buffer;
    owner?: CacheableModel;
  }) {
    super(options);
    this._entryMap = new Map();
    this._keyMap = new Map();

    entries.forEach((entry, id) => {
      this._entryMap.set(id, this._makeEntry(entry.key, entry.value, entry));
      const keyId = this._getKeyIdentifier(entry.key);
      if (!this._keyMap.has(keyId)) this._keyMap.set(keyId, id);
    });

    this._nextId = this.size;
  }

  //#region Overridden Public Methods

  uncache(): void {
    this.resetEntries();
    super.uncache();
  }

  validate(): void {
    this.entries.forEach(entry => entry.validate());
    const repeatedKeys = this.findRepeatedKeys();
    if (repeatedKeys.length > 0)
      throw new Error(`Repeated keys detected: ${repeatedKeys.map(key => this._getKeyIdentifier(key))}`)
  }

  //#endregion Overridden Public Methods

  //#region Public Methods

  /**
   * Creates a new entry with the given key and value, adds it to this model,
   * and returns it.
   * 
   * @param key Key of entry
   * @param value Value of entry
   * @returns The entry object that was created
   */
  add(key: Key, value: Value): Entry {
    const id = this._nextId++;
    if (this._entryMap.has(id))
      throw new Error(`Duplicated ID in mapped model: ${id}`);
    const entry = this._makeEntry(key, value);
    this._entryMap.set(id, entry);
    const keyId = this._getKeyIdentifier(key);
    if (!this._keyMap.has(keyId)) this._keyMap.set(keyId, id);
    this.uncache();
    return entry;
  }

  /**
   * Creates new entries for the give key/value pairs, adds them to this model,
   * and returns them in an array.
   * 
   * @param entries List of objects to add as entries
   * @returns An array of the entries that were created
   */
  addAll(entries: { key: Key; value: Value; }[]): Entry[] {
    return entries.map(entry => this.add(entry.key, entry.value));
  }

  /**
   * Removes all entries from this model.
   */
  clear() {
    if (this.size > 0) {
      this._entryMap.clear();
      this._keyMap.clear();
      this._nextId = 0;
      this.uncache();
    }
  }

  /**
   * Removes an entry from this model by its unique ID.
   * 
   * @param id ID of the entry to remove
   * @returns True if an entry was removed, false otherwise
   */
  delete(id: number): boolean {
    const entry = this._entryMap.get(id);
    
    if (entry) {
      this._entryMap.delete(id);

      const ids = this.getIdsForKey(entry.key);
      const keyId = this._getKeyIdentifier(entry.key);
      if (ids.length === 0) {
        this._keyMap.delete(keyId);
      } else {
        this._keyMap.set(keyId, ids[0]);
      }
      
      this.uncache();
      return true;
    } else {
      return false;
    }
  }

  /**
   * Removes the first entry from this model that has the given key.
   * 
   * @param key Key of the entry to remove
   * @returns True if an entry was removed, false otherwise
   */
  deleteByKey(key: Key): boolean {
    return this.delete(this.getIdForKey(key));
  }

  /**
   * Finds all keys that belong to more than one entry and returns them in an
   * array.
   * 
   * @returns Array of all repeated keys
   */
  findRepeatedKeys(): Key[] {
    const keys: Key[] = [];

    if (this._entryMap.size !== this._keyMap.size) {
      const seenKeys = new Set();
      this._entryMap.forEach(entry => {
        const keyId = this._getKeyIdentifier(entry.key);
        if (seenKeys.has(keyId)) {
          keys.push(entry.key);
        } else {
          seenKeys.add(keyId);
        }
      });
    }

    return keys;
  }

  /**
   * Returns the entry that has the given ID, or undefined if there isn't one.
   * 
   * @param id ID of entry to retrieve
   */
  get(id: number): Entry {
    return this._entryMap.get(id);
  }

  /**
   * Returns the first entry that has the given key, or undefined if there
   * aren't any.
   * 
   * @param key Key of entry to retrieve
   */
  getByKey(key: Key): Entry {
    return this.get(this.getIdForKey(key));
  }

  /**
   * Returns the ID of the first entry that has the given key. If there are no
   * entries with the given key, undefined is returned.
   * 
   * @param key Key to get IDs for
   */
  getIdForKey(key: Key): number {
    return this._keyMap.get(this._getKeyIdentifier(key));
  }

  /**
   * Returns an array of the IDs for every entry that has the given key.
   * Ideally, the result will always have one number, however, keys are not
   * guaranteed to be unique. If there are no entries with the given key, an
   * empty array is returned.
   * 
   * @param key Key to get IDs for
   */
  getIdsForKey(key: Key): number[] {
    const ids: number[] = [];

    for (const [ id, entry ] of this._entryMap) {
      if (entry.keyEquals(key)) ids.push(id);
    }

    return ids;
  }

  /**
   * Checks whether this model has an entry with the given ID.
   * 
   * @param id ID to check
   * @returns True if there is an entry with the given ID, false otherwise
   */
  has(id: number): boolean {
    return this._entryMap.has(id);
  }

  /**
   * Checks whether this model has an entry with the given key.
   * 
   * @param key Key to check
   * @returns True if there is an entry with the given key, false otherwise
   */
  hasKey(key: Key): boolean {
    return this.getIdForKey(key) !== undefined;
  }

  /**
   * Notifies this model that a key has been updated.
   * 
   * @param previous Previous key
   * @param current New key
   */
  _onKeyUpdate(previous: Key, current: Key) {
    const previousIdentifier = this._getKeyIdentifier(previous);
    const currentId = this._keyMap.get(previousIdentifier);

    const ids = this.getIdsForKey(previous);
    if (ids.length === 0) {
      this._keyMap.delete(previousIdentifier);
    } else {
      this._keyMap.set(previousIdentifier, ids[0]);
    }
    
    const currentIdentifier = this._getKeyIdentifier(current);
    if (!this._keyMap.has(currentIdentifier)) {
      this._keyMap.set(currentIdentifier, currentId);
    }

    this.uncache();
  }

  /**
   * Resets the `entries` property of this model, so that a new array will be
   * created the next time it is used.
   */
  resetEntries() {
    delete this._cachedEntries;
  }

  /**
   * Resets the key map (i.e. the object that maps entry keys to their unique
   * IDs) of this model to guarantee that all keys are mapped to the ID of the
   * first entry they appear in. This function should not ever have to be used,
   * but is supplied in case the key map ever falls out of sync after editing /
   * deleting a lot of entries. If you find yourself having to use this method,
   * please report why here: https://github.com/sims4toolkit/models/issues
   */
  resetKeyMap() {
    this._keyMap.clear();
    for (const [ id, entry ] of this._entryMap) {
      const keyIdentifier = this._getKeyIdentifier(entry.key);
      if (!this._keyMap.has(keyIdentifier)) this._keyMap.set(keyIdentifier, id);
    }
  }

  //#endregion Public Methods

  //#region Protected Methods

  /**
   * Returns a unique value that represents the given key compared to other
   * keys of its type.
   * 
   * @param key Key to get unique identifier for
   */
  protected abstract _getKeyIdentifier(key: Key): number | string;

  /**
   * Creates a new entry to add to this model.
   * 
   * @param key Key of entry
   * @param value Value of entry
   * @param dto Optional DTO that is being used to create this entry
   */
  protected abstract _makeEntry(key: Key, value: Value, dto?: any): Entry;

  //#endregion Protected Methods
}

/**
 * An entry in a MappedModel. This entry is responsible for notifying the owner
 * when its key or value updates.
 */
export interface MappedModelEntry<Key, Value> {
  owner?: MappedModel<Key, Value, MappedModelEntry<Key, Value>>;

  /** The key for this entry. */
  key: Key;

  /** The value of this entry. */
  value: Value;

  /**
   * Checks if the given key is equal to the one that this entry uses.
   * 
   * @param key Key to check for equality
   * @returns True if the keys are equal, false otherwise
   */
  keyEquals(key: Key): boolean;

  /**
   * Verifies that this entry is valid. If it isn't, a detailed exception is
   * thrown to explain what is wrong. If nothing is wrong, no exception is
   * thrown.
   * 
   * @throws If this model is invalid
   */
  validate(): void;
}
