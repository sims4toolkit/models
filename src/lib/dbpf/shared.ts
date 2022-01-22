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
  simData?: boolean;
  stringTables?: boolean;
  tuning?: boolean;
  organize?: boolean;
}

export const ZLIB_COMPRESSION = 23106;
