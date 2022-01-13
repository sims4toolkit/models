/**
 * Options for reading a resource from its binary form.
 */
export interface SerializationOptions {
  /**
   * If `true`, then non-critical errors will be ignored, and parsing will
   * continue until termination or a fatal error. This is `false` by default.
   */
  ignoreErrors: boolean;

  /**
   * If true, then the result of a resource's static `from()` method will not
   * throw an error. If there is an error, the function will return `undefined`
   * instead.
   */
  dontThrow: boolean;
}
