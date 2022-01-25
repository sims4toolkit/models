/**
 * Options to configure when reading a file.
 */
export interface FileReadingOptions {
  /**
   * (For packages only) If true, then the compressed buffer for a resource will
   * not be cached in the resource entry. False by default.
   * 
   * This is recommended when loading packages in read-only mode, or while
   * extracting resources from packages, so as to reduce the memory load.
   * Cacheing the compressed buffer is only worthwhile when a package is
   * actively being edited, or when a small subset of resources are being
   * edited within it.
   */
  dontCacheCompressedBuffer: boolean;

  /**
   * If true, then the decompressed buffer for a resource will not be cached.
   * False by default.
   * 
   * This is recommended when loading packages or resources in read-only mode,
   * so as to reduce the memory load.
   */
  dontCacheResource: boolean;

  /**
   * If true, models that cannot be read will be `undefined`, rather than
   * throwing an exception. False by default.
   */
  dontThrow?: boolean;
  
  /**
   * If true, non-critical errors will be ignored while reading the file. False
   * by default.
   * 
   * Note that this option does NOT prevent exceptions from being thrown. Its
   * purpose is to ignore negligible errors, such as an incorrect file version
   * or an issue with the file header. Critical errors, such as missing data in
   * a binary file, will still cause an exception.
   */
  ignoreErrors?: boolean;

  /**
   * (For packages only) If true, then all resources in the package will be
   * loaded as a raw resource (i.e. just a buffer) rather than being fully
   * parsed into its respective model. False by default.
   * 
   * This is recommended when extracting files from packages, so as to reduce
   * the computation load.
   */
  loadRaw?: boolean;
}
