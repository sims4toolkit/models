import type Resource from "../resources/resource";

/**
 * Pairing of a resource key and resource it belongs to.
 */
export interface ResourceKeyPair {
  key: ResourceKey;
  value: Resource;
  buffer?: Buffer; // compressed buffer
}

/**
 * The (ideally) unique identifier for a resource.
 */
export interface ResourceKey {
  type: number;
  group: number;
  instance: bigint;
}

/**
 * Options to use when extracting files from a DBPF buffer.
 */
export interface ExtractionOptions {
  /** Whether or not to extract simdata. False by default. */
  simData?: boolean;

  /** Whether or not to extract string tables. False by default. */
  stringTables?: boolean;

  /** Whether or not to extract tuning. True by default. */
  tuning?: boolean;
}

export const ZLIB_COMPRESSION = 23106;
