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
