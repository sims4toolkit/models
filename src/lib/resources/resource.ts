import type WritableModel from "../base/writable-model";
import type EncodingType from "../enums/encoding-type";

/**
 * A base for all resources to implement. This is an interface rather than a 
 * class so that individual resources can inherit from whatever base model they
 * need.
 */
export default interface Resource extends WritableModel {
  /** How this resource is encoded. */
  readonly encodingType: EncodingType;

  // Just to clarify that the clone is a resource
  clone(): Resource;

  /**
   * Returns true if this resource contains XML, false otherwise.
   */
  isXml(): boolean;
}
