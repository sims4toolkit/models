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
   * (For packages only) If true, then the buffers that are saved on resources
   * will be decompressed. This has no effect on non-raw resources unless the
   * `saveBuffer` option is also enabled. False by default.
   * 
   * Recommended when extracting resources to write them to disk individually.
   */
  decompressBuffer?: boolean;

  /**
   * (For binary files only) If true, non-critical errors will be ignored while
   * reading the file(s), and an exception will only be thrown when it is
   * totally unavoidable. False by default.
   * 
   * Recommended when recovering potentially corrupt resources from a package.
   */
  ignoreErrors?: boolean;

  /**
   * (For packages only) If true, then any erred resources will be loaded raw
   * (i.e. just a buffer) instead of causing an exception. False by default.
   * 
   * Recommended when recovering potentially corrupt resources from a package.
   */
  loadErrorsAsRaw?: boolean;

  /**
   * (For packages only) If true, then all resources in the package will be
   * loaded raw (i.e. just a buffer) rather than being fully parsed into their
   * respective models. False by default.
   * 
   * Note that raw resources remain in their original compression format by
   * default. If decompressed resources are needed (such as when extracting
   * files to write to disk), set `decompressBuffer: true` as well.
   */
  loadRaw?: boolean;

  /**
   * (For packages only) If provided, then the only resources that will be
   * loaded are those whose keys return true from this function. If not
   * provided, then all resources are loaded.
   * 
   * Recommended when extracting a certain type of resource from a package, such
   * as all string tables and nothing else.
   */
  resourceFilter?: ResourceFilter;

  /**
   * If true, then the buffer for this resource (or all resources, if used with
   * a package) will be saved on its model. The buffer is cached when the
   * resource is initially loaded, uncached whenever a change is detected, and
   * re-cached the next time it is serialized (i.e. next time the `buffer`
   * property is accessed). False by default.
   * 
   * Whether the buffer being saved is compressed or not depends on what the
   * `decompressBuffer` option is set to. It is also false by default.
   * 
   * It is recommended to save compressed buffers whenever entire packages are
   * going to be written, and it is recommended to save decompressed buffers
   * whenever individual resources are going to be written.
   */
  saveBuffer?: boolean;
}
