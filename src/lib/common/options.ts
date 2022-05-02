/**
 * Function that can be used to filter entries in a DBPF by their type, group,
 * and/or instance ID.
 */
export type ResourceFilter = (type: number, group: number, instance: bigint) => boolean;


/**
 * Options to configure when reading binary files.
 */
export interface BinaryFileReadingOptions extends Partial<{
  /**
   * If true, non-critical errors will be ignored while reading the file(s), and
   * exceptions will only be thrown when totally unavoidable. If being used on a
   * package, any erred resources will be loaded raw (i.e. just a buffer)
   * instead of causing an exception. False by default.
   * 
   * Recommended when recovering potentially corrupt resources from a package.
   */
  recoveryMode: boolean;

  /**
   * If true, then the buffer for this resource (or all resources, if used with
   * a package) will be saved on its model. The buffer is cached when the
   * resource is initially loaded, uncached whenever a change is detected, and
   * re-cached the next time it is serialized. False by default.
   * 
   * It is recommended to save compressed buffers whenever entire packages are
   * going to be written, and it is recommended to save decompressed buffers
   * whenever individual resources are going to be written.
   */
  saveBuffer: boolean;
}> { };


/**
 * Options to configure when reading package files.
 */
export interface PackageFileReadingOptions extends
  BinaryFileReadingOptions,
  Partial<{
    /**
     * If true, then the buffers that are saved on resources will be
     * decompressed. This has no effect on non-raw resources unless the
     * `saveBuffer` option is also enabled. False by default.
     * 
     * Recommended when extracting resources to write them to disk individually.
     */
    decompressBuffers: boolean;

    /**
     * If true, then all resources in the package will be loaded raw (i.e. just
     * a buffer) rather than being fully parsed into their respective models.
     * False by default.
     * 
     * Note that raw resources remain in their original compression format by
     * default. If decompressed resources are needed (such as when extracting
     * files to write to disk), set `decompressBuffers: true` as well.
     */
    loadRaw: boolean;

    /**
     * If provided, then the only resources that will be loaded are those whose
     * keys return true from this function. If not provided, then all resources
     * are loaded.
     * 
     * Recommended when extracting a certain type of resource from a package,
     * such as all string tables and nothing else.
     */
    resourceFilter: ResourceFilter;
  }> { };


/**
 * TODO:
 */
export interface XmlExtractionOptions extends Partial<{
  // TODO: comments and maps
  restoreComments: boolean;
  filter: () => boolean; // FIXME: filter what?
  limit: number;
}> { };
