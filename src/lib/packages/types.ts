import type Resource from "../resources/resource";

/**
 * Pairing of a resource key and resource it belongs to.
 */
export interface ResourceKeyPair<ResourceType extends Resource = Resource> {
  key: ResourceKey;
  value: ResourceType;
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
 * The exact bytes within a DBPF where a resource can be found.
 */
export interface ResourcePosition {
  indexStart: number;
  recordStart: number;
  recordSize: number;
}
