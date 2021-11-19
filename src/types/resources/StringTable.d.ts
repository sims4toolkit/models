// import type { Resource } from './ResourceBase';


export type StringEntryPredicate = (entry: StringEntry) => boolean;

export interface StringSearchOptions {
  caseSensitive?: boolean;
  includeSubstrings?: boolean;
}

export interface StringEntry {
  readonly id: number;
  key: number;
  string: string;
}

export interface StringTableResource {
  /**
   * Adds an entry to this string table and returns its generated ID.
   * 
   * @param key The string's key
   * @param string The string
   */
  addEntry(key: number, string: string): number;

  /**
   * Returns the number of entries that match the given predicate, or the total
   * number of entries if none is given.
   * 
   * @param predicate Optional predicate to filter strings by
   */
  numEntries(predicate?: StringEntryPredicate): number;

  /**
   * Returns the first entry that matches the given predicate, or undefined if
   * none match.
   * 
   * @param predicate Predicate to filter strings by
   */
  getEntry(predicate: StringEntryPredicate): StringEntry;

  /**
   * Returns all entries that match the given predicate if there if one. If
   * there is no predicate, all strings are returned. If no strings match the
   * predicate, an empty array is returned.
   * 
   * @param predicate Optional predicate to filter strings by
   */
  getEntries(predicate?: StringEntryPredicate): StringEntry[];

  /**
   * Returns the entry that has the given ID, or undefined if there isn't one.
   * 
   * @param id The unique identifier for a string entry
   */
  getEntryById(id: number): StringEntry;

  /**
   * Returns the first entry that has the given key, or undefined if none do.
   * 
   * @param key The key for a string entry
   */
  getEntryByKey(key: number): StringEntry;

  /**
   * Returns all entries that have the given key, or an empty list if there are
   * none that do.
   * 
   * @param key The key for a string entry
   */
  getEntriesByKey(key: number): StringEntry[];

  /**
   * Returns the first entry that contains the given string following the given
   * options. All options are false by default, so if no options are passed,
   * the search will be for a case-insensitive exact match.
   * 
   * @param string String to search for
   */
  getEntryByString(string: string, options?: StringSearchOptions): StringEntry;

  /**
   * Returns all entries that contain the given string following the given
   * options. All options are false by default, so if no options are passed,
   * the search will be for a case-insensitive exact match.
   * 
   * @param string String to search for
   */
  getEntriesByString(string: string, options?: StringSearchOptions): StringEntry[];
}
