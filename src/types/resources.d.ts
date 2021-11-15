/**
 * An entry for a resource that has a key.
 */
export interface ResourceEntry {
  key: ResourceKey;
  resource: Resource;
}

/**
 * The unique type, group, and instance for a resource.
 */
export interface ResourceKey {
  type: number;
  group: number;
  instance: bigint;
}

/**
 * A resource that appears in a DBPF.
 */
export interface Resource {
  /** The name of this resource, if it has one. */
  readonly filename?: string;

  /**
   * Returns a Buffer that can be used to write this resource to a DBPF.
   * The Buffer is NOT compressed – compression is the DBPF's responsibility.
   * 
   * @returns Buffer to write to DBPF
   */
  getBuffer(): Buffer;
}

interface SimData extends Resource {
  getData(): { [key: string]: number; }
}
