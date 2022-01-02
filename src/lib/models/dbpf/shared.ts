import type Resource from "../resources/resource";

/**
 * A DTO for package models (DBPFs).
 */
export interface DbpfDto {
  // TODO:
}

/** The (ideally) unique identifier for a resource. */
export interface ResourceKey {
  type: number;
  group: number;
  instance: number | bigint;
}

export type ResourceEntryPredicate = (entry: ResourceEntry) => boolean;

/**
 * A wrapper for a resource to track its metadata within a DBPF.
 */
export interface ResourceEntry {
  readonly id: number;
  key: ResourceKey;
  resource: Resource;
  cachedBuffer?: Buffer;
}

/**
 * Options to configure when creating a new DBPF.
 */
export interface DbpfOptions {
  ignoreErrors: boolean;
  loadRaw: boolean;
}
