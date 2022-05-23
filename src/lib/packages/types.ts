import type Resource from "../resources/resource";

/**
 * Pairing of a resource key and resource it belongs to.
 */
export interface ResourceKeyPair<T extends Resource = Resource> {
  key: ResourceKey;
  value: T;
}

/**
 * The (ideally) unique identifier for a resource.
 */
export interface ResourceKey {
  type: number;
  group: number;
  instance: bigint;
}
