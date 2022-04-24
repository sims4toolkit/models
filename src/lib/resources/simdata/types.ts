import type { Cell } from "./cells";
import type { SimDataInstance, SimDataSchema } from "./fragments";

/**
 * Valid versions for SimData binaries.
 */
export type SimDataVersion = 0x100 | 0x101;

/**
 * A transfer object for SimData models.
 */
export interface SimDataDto extends Partial<{
  /** The version of SimData being loaded. */
  version: SimDataVersion;

  /** The unused number (usually matches the pack group). */
  unused: number;

  /** Array of schemas in the SimData. */
  schemas: SimDataSchema[];

  /** Array of instances in the SimData. */
  instances: SimDataInstance[];
}> { };

/**
 * Additional options required for a cell to encode itself.
 */
export interface CellEncodingOptions extends Partial<{
  /** The relative offset at which the cell is to be encoded. */
  offset: number;
}> { };

/**
 * A row in an ObjectCell that maps names to other cells.
 */
export interface ObjectCellRow {
  [key: string]: Cell;
};

/**
 * Additional options required for a cell to clone itself.
 */
export interface CellCloneOptions extends Partial<{
  /** Whether or not schemas should be cloned instead of reusing objects. */
  cloneSchema: boolean;

  /** Array of new schema objects to use. */
  newSchemas: SimDataSchema[];
}> { };

/**
 * Additional options for a cell to generate itself as XML.
 */
export interface CellToXmlOptions extends Partial<{
  /** The value to appear in the "name" attribute. */
  nameAttr: string;

  /** Whether or not to display the "type" attribute. */
  typeAttr: boolean;
}> { };
