/**
 * Function that can be used to filter entries in a DBPF by their type, group,
 * and/or instance ID.
 */
export type ResourceFilter = (type: number, group: number, instance: bigint) => boolean;


/**
 * Options to configure when reading a file.
 */
export interface FileReadingOptions {
  /**
   * (For packages only) If provided, then the only resources that will be
   * loaded are those that pass (i.e. return true from) this function. If not
   * provided, then all resources will be loaded.
   * 
   * If using a filter to extract files, it is strongly recommended to also use
   * the `loadRaw` option, so that models are not needlessly created when all
   * you need are the buffers.
   */
  resourceFilter?: ResourceFilter;

  /**
   * (For binary files only) If true, non-critical errors will be ignored while
   * reading the file(s), and an exception will only be thrown when it is
   * totally unavoidable. False by default.
   */
  ignoreErrors?: boolean;

  /**
   * (For packages only) If true, then any erred resources will be loaded raw
   * (i.e. just a buffer rather than a fully parsed model) instead of causing an
   * exception. False by default.
   */
  loadErrorsAsRaw?: boolean;

  /**
   * (For packages only) If true, then all resources in the package will be
   * loaded raw (i.e. just a buffer) rather than being fully parsed into its
   * respective model. False by default.
   * 
   * This is recommended when parsed models are not required while extracting
   * files from packages. If parsed models are required, consider using the
   * `saveBuffer` option instead.
   */
  loadRaw?: boolean;

  /**
   * If true, then the decompressed buffer for a resource will be saved on its
   * model. Note that raw resources always save their buffer regardless of this
   * option, as it is their only defining feature. False by default.
   * 
   * If this option is used on a package, it refers to the decompressed buffers
   * for the resources within the package, not the buffer for the package
   * itself. Package's buffer cannot be saved, as doing so would consume twice
   * as much memory for no benefit. If you need to copy a package without
   * mutating its contents, you can just copy/paste it (like an NFT).
   * 
   * This is recommended when parsed models are required while extracting files
   * from packages. If parsed models are not required, consider using the
   * `loadRaw` option instead, so that models are not needlessly created.
   */
  saveBuffer?: boolean;

  /**
   * (For packages only) If true, then the compressed buffer for a resource will
   * be saved on its resource entry. False by default.
   * 
   * This is recommended when editing a subset of the resources in a package and
   * then writing it back to disk as a complete package.
   */
  saveCompressedBuffer?: boolean;
}
