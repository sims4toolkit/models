import CacheableModel from "./cacheableModel";
import WritableModel from "./writableModel";

/**
 * TODO:
 */
export abstract class MappedModel<Key, Value, Entry extends MappedModelEntry<Key, Value>> extends WritableModel {
  private readonly _entryMap: Map<number, Entry>;
  private _nextId: number;

  /**
   * An iterable of the entries in this model. Note that mutating this iterable
   * will not update the model, but mutating individual entries will.
   */
  get entries(): IterableIterator<Entry> {
    return this._entryMap.values();
  }

  /**
   * The number of entries in this model.
   */
  get size(): number {
    return this._entryMap.size;
  }

  protected constructor(entries: Map<number, Entry>, options: {
    buffer?: Buffer;
    owner?: WritableModel;
  } = {}) {
    super(options);
    this._entryMap = entries ?? new Map();
    this._nextId = this._entryMap.size;
  }

  //#region Public Methods

  /**
   * Adds an entry to this model and generates a unique ID for it.
   * 
   * @param entry Entry to add
   * @returns Unique ID for this entry (not equal to its key)
   */
  add(entry: Entry): number {
    const id = this._nextId++;
    this._entryMap.set(id, entry);
    this.uncache();
    return id;
  }

  /**
   * Removes all entries from this model.
   */
  clear() {
    if (this.size > 0) {
      this._entryMap.clear();
      this._nextId = this.size;
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
    const deleted = this._entryMap.delete(id);
    if (deleted) this.uncache();
    return deleted;
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
    for (const [ id, entry ] of this._entryMap) {
      if (entry.keyEquals(key)) return id;
    }

    return undefined;
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
   * Checks whether this model has an entry with the given key.
   * 
   * @param key Key to check
   * @returns True if there is an entry with the given key, false otherwise
   */
  hasKey(key: Key): boolean {
    return this.getIdForKey(key) !== undefined;
  }

  //#endregion Public Methods
}

/**
 * TODO:
 */
export abstract class MappedModelEntry<Key, Value> extends CacheableModel {
  public owner?: MappedModel<Key, Value, MappedModelEntry<Key, Value>>;
  public key: Key;
  public value: Value;

  // TODO:

  /**
   * Returns a string that uniquely identifies the key of this entry comparative
   * to other keys of the same type.
   */
  abstract getKeyString(): string;

  /**
   * Checks if the given key is equal to the one that this entry uses.
   * 
   * @param key Key to check for equality
   * @returns True if the keys are equal, false otherwise
   */
  abstract keyEquals(key: Key): boolean;
}
