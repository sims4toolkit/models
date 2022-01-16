import type { Cell } from "./simDataCells";
import type { SimDataInstance, SimDataSchema } from "./simDataFragments";

/**
 * A transfer object for SimData models.
 */
export interface SimDataDto {
  version?: number;
  unused?: number;
  schemas?: SimDataSchema[];
  instances?: SimDataInstance[];
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

// Constants
export const RELOFFSET_NULL = -0x80000000;
export const NO_NAME_HASH = 0x811C9DC5; // equal to fnv32('')
export const HEADER_SIZE = 32; // includes 4 bytes of padding
export const TABLE_HEADER_OFFSET = 24;
export const SUPPORTED_VERSION = 0x101;
