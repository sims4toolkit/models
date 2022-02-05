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

  /**
   * True if this resource is permanently compressed in the format specified by
   * `compressionType`. Note that this property is true for uncompressed data if
   * `compressionType === CompressionType.Uncompressed`.
   */
  readonly isCompressed: boolean;

  /**
   * (Only for resources that are permanently compressed) The size of this 
   * resource when it is decompressed.
   */
  readonly sizeDecompressed?: number;

  // Just to clarify that the clone is a resource
  clone(): Resource;

  /**
   * Returns true if this resource contains XML, false otherwise.
   */
  isXml(): boolean;
}
