import type { Resource } from './ResourceBase';

/**
 * A resource that consists of plain-text XML.
 */
export interface TuningResource extends Resource {
  /**
   * Gets the XML contents of this resource.
   */
  getXML(): string;

  /**
   * Gets the name of this tuning file from its n="" attribute.
   */
  getName(): string;

  /**
   * Gets the name of this tuning file's type. Equal to the value in i="".
   * 
   * Type names are snake case (like_this) by default, but can be converted to
   * title case (Like This) by setting `useTitleCase` to true.
   * 
   * @param useTitleCase Whether or not the result should be in title case
   */
  getTypeName(useTitleCase?: boolean): string;

  /**
   * Gets the name of this tuning file's class. Equal to the value in `c=`.
   */
  getClassName(): string;

  /**
   * Gets the path where this tuning file's class can be found in script. Equal
   * to the value in `m=`.
   */
  getScriptPath(): string;
}
