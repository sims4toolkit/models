import type WritableModel from "../base/writable-model";
import CompressionType from "../compression/compression-type";
import type EncodingType from "../enums/encoding-type";

/**
 * A base for all resources to implement.
 */
export default interface Resource extends WritableModel {
  /** How this resource is encoded. */
  readonly encodingType: EncodingType;

  /** How this resource is or should be compressed when written in a package. */
  readonly compressionType: CompressionType;

  /** True if this resource is permanently compressed. */
  readonly isCompressed: boolean;

  // Just to clarify that the clone is a resource
  clone(): Resource;

  /**
   * Returns true if this resource contains XML, false otherwise.
   */
  isXml(): boolean;
}
