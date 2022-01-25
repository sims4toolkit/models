/**
 * Options to configure when reading a file.
 */
export interface FileReadingOptions {  
  /**
   * (For binary files only) If true, non-critical errors will be ignored while
   * reading the file(s). False by default.
   * 
   * Note that this option does NOT prevent exceptions from being thrown. Its
   * purpose is to ignore negligible errors, such as an incorrect file version
   * or an issue with the file header. Critical errors, such as missing data or
   * incorrect data type, will still cause an exception.
   */
  ignoreErrors?: boolean;

  /**
   * (For packages only) If true, then any erred resources will be loaded raw
   * instead of causing an exception. False by default.
   */
  loadErrorsAsRaw?: boolean;

  /**
   * (For packages only) If true, then all resources in the package will be
   * loaded as a raw resource (i.e. just a buffer) rather than being fully
   * parsed into its respective model. False by default.
   * 
   * This is recommended when extracting files from packages, so that fully
   * parsed models are not needlessly created. If there is a need for fully
   * parsed models, consider using the `saveBuffer` option instead.
   */
  loadRaw?: boolean;

  /**
   * If true, then the decompressed buffer for a resource will be saved on its
   * model. Note that raw resources always save their buffer regardless of this
   * option, as it is their only defining feature. False by default.
   * 
   * This is recommended when parsed models are required while extracting files
   * from packages. If there is no need to parse the models and just the buffers
   * are needed, consider using the `loadRaw` option instead so that time is not
   * wasted parsing models.
   */
  saveBuffer?: boolean;

  /**
   * (For packages only) If true, then the compressed buffer for a resource will
   * be saved on its resource entry. False by default.
   * 
   * This is recommended when editing a subset of the resources in a package and
   * then writing it back to disk.
   */
  saveCompressedBuffer?: boolean;
}
