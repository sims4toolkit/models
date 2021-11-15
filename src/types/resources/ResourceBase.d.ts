/** How the resource file is encoded. */
type ResourceVariant = 'XML' | 'DATA' | 'STBL' | undefined;

/**
 * The combination of type, group, and instance used to identify individual
 * resources by the game. There is no guarantee that resource keys are unique
 * within a DBPF, and resource keys are allowed to be changed. For reliable
 * uniqueness and stability, use the ResourceEntry's `id` property.
 */
interface ResourceKey {
  /** The resource type. Must be 32-bit or smaller. */
  type: number;

  /** The resource group. Must be 32-bit or smaller. */
  group: number;

  /** The resource instance. Must be 64-bit or smaller. */
  instance: bigint;
}

/**
 * A resource file that contains data. This object knows nothing about its
 * metadata in a DBPF.
 */
export interface Resource {
  /** How this resource is encoded. */
  readonly variant: ResourceVariant;

  /**
   * Returns a buffer that can be used to write this resource in a DBPF. The
   * buffer is NOT compressed – compression is the DBPF's responsibility.
   * 
   * @returns Buffer to write to DBPF
   */
  getBuffer(): Buffer;
}

/**
 * A wrapper for a resource to track its metadata within a DBPF.
 */
export interface ResourceEntry {
  readonly id: number;
  key: ResourceKey;
  resource: Resource;
}
