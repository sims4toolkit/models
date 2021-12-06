/** How a resource is encoded. */
export type ResourceVariant = 'RAW' | 'XML' | 'DATA' | 'STBL';

/** The (ideally) unique identifier for a resource. */
export interface ResourceKey {
  type: number;
  group: number;
  instance: number | bigint;
}