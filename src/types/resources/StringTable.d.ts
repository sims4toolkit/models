
export interface StringTableEntry {
  key: number;
  string: string;
}

export interface StringSearchOptions {
  includeSubstrings?: boolean;
  caseSensitive?: boolean;
}

/**
 * A String Table that appears in a DBPF. Since there is no strict
 * requirement for string entries to have a unique key or string,
 * every entry has its own unique identifier as well. This indentifier
 * is specific to this program, and is not persisted in a DBPF.
 */
export interface StringTableResource {
  //#region Create

  /**
   * Adds a new entry to this String Table and returns
   * its unique ID.
   * 
   * @param entry The entry to add
   */
  addEntry(entry: StringTableEntry): number;

  //#endregion Create

  //#region Read

  /**
   * Returns the number of entries in this string table.
   */
  numEntries(): number;

  /**
   * Gets the first entry that passes the given predicate.
   * 
   * @param predicate Function to find an entry
   */
  getEntry(predicate: (entry: StringTableEntry) => boolean): StringTableEntry;

  /**
   * Gets an entry from its unique ID in this table.
   * 
   * @param id The unique ID of the string to get
   */
  getEntryById(id: number): StringTableEntry;

  /**
   * Gets the first entry that has the given key. Ideally, all
   * entries should have a unique key, however, this is not strictly
   * enforced, so it should not be assumed.
   * 
   * @param key The key of the string to get
   */
  getEntryByKey(key: number): StringTableEntry;

  /**
   * Gets the first entry that contains the given string following
   * the rules set forth by the options. All options are assumed
   * to be false unless set to true.
   * 
   * @param key The key of the string to get
   */
  getEntryByString(string: string, options?: StringSearchOptions): StringTableEntry;

  /**
   * Gets all entries in this String Table that pass the given
   * predicate. If the predicate is undefined, then all of the
   * entries will be returned.
   * 
   * @param predicate Optional function to filter the results with
   */
  getEntries(predicate?: (entry: StringTableEntry) => boolean): StringTableEntry[];

  /**
   * Gets all entries in this String Table that have the given
   * key. Ideally, all entries should have a unique key, however,
   * this is not strictly enforced, so it should not be assumed.
   * 
   * @param key Key to find entries for
   */
  getEntriesByKey(key: number): StringTableEntry[];

  /**
   * Gets all entries in this String Table that contain the given
   * string following the rules set forth by the options. All
   * options are assumed to be false unless set to true.
   * 
   * @param string String to find entries for
   * @param options Optional arguments to refine the search
   */
  getEntriesByString(string: string, options?: StringSearchOptions): StringTableEntry[];

  //#endregion Read

  //#region Update

  // TODO:

  //#endregion Update

  //#region Delete

  deleteEntry(entry: StringTableEntry): void;
  deleteEntryById(id: number): void;

  //#endregion Delete
}
