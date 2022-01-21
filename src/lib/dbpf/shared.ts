import type Resource from "../resources/resource";

/**
 * Pairing of a resource key and resource it belongs to.
 */
export interface ResourceKeyPair {
  key: ResourceKey;
  value: Resource;
  buffer?: Buffer;
}

/**
 * The (ideally) unique identifier for a resource.
 */
export interface ResourceKey {
  type: number;
  group: number;
  instance: bigint;
}

export const ZLIB_COMPRESSION = 23106;
