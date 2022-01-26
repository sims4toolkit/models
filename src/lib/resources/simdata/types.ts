import type { Cell } from "./cells";
import type { SimDataInstance, SimDataSchema } from "./fragments";

/**
 * A transfer object for SimData models.
 */
export interface SimDataDto {
  version?: number;
  unused?: number;
  schemas?: SimDataSchema[];
  instances?: SimDataInstance[];
  saveBuffer?: boolean;
}

/**
 * Additional options required for a cell to encode itself.
 */
export interface CellEncodingOptions {
  offset?: number;
}

/**
 * A row in an ObjectCell.
 */
export interface ObjectCellRow {
  [key: string]: Cell;
};

/**
 * Additional options required for a cell to clone itself.
 */
export interface CellCloneOptions {
  cloneSchema?: boolean;
  newSchemas?: SimDataSchema[];
};

/**
 * Additional options for a cell to generate itself as XML.
 */
export interface CellToXmlOptions {
  nameAttr?: string;
  typeAttr?: boolean;
}
