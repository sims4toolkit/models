import WritableModel from "../abstract/writableModel";

type ResourceVariant = 'RAW' | 'XML' | 'DATA' | 'STBL';

/**
 * A base class for all resources.
 */
export default abstract class Resource extends WritableModel {
  /** How this resource is encoded. */
  abstract readonly variant: ResourceVariant;

  /** Returns a deep copy of this resource. */
  abstract clone(): Resource;
}
