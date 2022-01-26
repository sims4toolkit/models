import type ApiModelBase from "../base/api-model";
import type EncodingType from "../enums/encoding-type";

/**
 * A base for all resources to implement.
 */
export default interface Resource extends ApiModelBase {
  /** How this resource is encoded. */
  readonly encodingType: EncodingType;

  // Just to clarify that the clone is a resource
  clone(): Resource;

  /**
   * Returns true if this resource contains XML, false otherwise.
   */
  isXml(): boolean;
}
