import type { DbpfDto, DbpfOptions, ResourceEntry, ResourceEntryPredicate } from './shared';

import WritableModel from "../abstract/writableModel";
import readDbpf from './serialization/readDbpf';
import writeDbpf from './serialization/writeDbpf';


/**
 * Model for a Sims 4 package file (also called a "Database Packed File", or
 * DBPF for short). Sims 4 Toolkit uses "DBPF" instead of "package" to avoid
 * confusion with npm packages and the reserved `package` keyword.
 */
export default class Dbpf extends WritableModel implements DbpfDto {
  private _nextId: number;
  private _entries: ResourceEntry[];

  protected constructor(entries: ResourceEntry[] = [], buffer?: Buffer) {
    super({ buffer });
    this._entries = entries;
    this._nextId = entries.length;
  }

  /**
   * Creates and returns a new, empty DBPF.
   */
  static create(): Dbpf {
    return new Dbpf([]);
  }

  /**
   * Creates a new DBPF from a buffer that contains binary data.
   */
  static from(buffer: Buffer, options?: DbpfOptions): Dbpf {
    return new Dbpf(readDbpf(buffer, options), buffer);
  }

  /**
   * TODO:
   * 
   * @param predicate TODO:
   * @returns TODO:
   */
  numEntries(predicate?: ResourceEntryPredicate): number {
    return this.getEntries(predicate).length;
  }

  /**
   * TODO:
   * 
   * @param predicate TODO:
   * @returns TODO:
   */
  getEntries(predicate?: ResourceEntryPredicate): ResourceEntry[] {
    if (predicate === undefined) return this._entries;
    return this._entries.filter(predicate);
  }

  protected _serialize(): Buffer {
    return writeDbpf(this);
  }
}
