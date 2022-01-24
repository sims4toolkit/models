/**
 * Options to configure when reading a file.
 */
export interface FileReadingOptions {
  /**
   * If `true`, then non-critical errors will be ignored, and parsing will
   * continue until termination or a fatal error. This is `false` by default.
   */
  ignoreErrors?: boolean;

  /**
   * If `true`, then the result of a resource's static `from()` method will not
   * throw an error. If there is an error, the function will return `undefined`
   * instead. This is `false` by default.
   */
  dontThrow?: boolean;

  /**
   * (For packages only) If `true`, then the resources within this package will
   * all be loaded as raw resources, and can only be read as plain text. This is
   * `false` by default.
   */
  loadRaw?: boolean;
}
