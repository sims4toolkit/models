/**
 * Something that can be wrong with a string table.
 */
export type StringTableError = 
  'Duplicate Keys' |
  'Duplicate Strings' |
  'Empty String';

/**
 * An entry in a string table.
 */
export interface KeyStringPair {
  key: number;
  string: string;
}
