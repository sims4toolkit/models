import WritableModel from "../base/writableModel";

type ResourceVariant = 'RAW' | 'XML' | 'DATA' | 'STBL';

/**
 * A base class for all resources.
 */
export default abstract class Resource extends WritableModel {
  /** How this resource is encoded. */
  abstract readonly variant: ResourceVariant;

  /** Returns a deep copy of this resource. */
  abstract clone(): Resource;

  /**
   * Returns whether this resource contains the exact same values as another.
   * 
   * @param other Other resource to check for equality with this one
   */
  equals(other: Resource): boolean {
    return other && this.variant === other.variant;
  }

  /**
   * Returns true if this resource contains XML.
   */
  isXml(): boolean {
    return false;
  }
}
