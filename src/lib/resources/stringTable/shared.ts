/**
 * Something that can be wrong with a string table.
 */
export type StringTableError = 
  'Duplicate Keys' |
  'Duplicate Strings' |
  'Empty String';

/**
 * A DTO for string table models (STBLs).
 */
export interface StblDto {
  header: StblHeader;
  entries: KeyStringPair[];
}

/**
 * An object containing the header values for a STBL.
 */
export interface StblHeader {
  version?: number; // uint16
  compressed?: number; // byte
  reserved1?: number; // byte
  reserved2?: number; // byte
}

/**
 * An entry in a string table.
 */
export interface KeyStringPair {
  key: number;
  value: string;
}
