import DataType from "../../enums/data-type";
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

/** Data types that are 32-bit (or less) numbers. */
export type SimDataNumber = 
  DataType.Int8 |
  DataType.UInt8 |
  DataType.Int16 |
  DataType.UInt16 |
  DataType.Int32 |
  DataType.UInt32 |
  DataType.Float |
  DataType.LocalizationKey;

/** Data types that are 64-bit numbers. */
export type SimDataBigInt = 
  DataType.Int64 |
  DataType.UInt64 |
  DataType.TableSetReference;

/** Data types that can be stored in a string. */
export type SimDataText =
  DataType.Character |
  DataType.String |
  DataType.HashedString;

/** Data types that consist of a set number of floats. */
export type SimDataFloatVector =
  DataType.Float2 |
  DataType.Float3 |
  DataType.Float4;

/** Data types that contain primitives/non-recursive value. */
export type SimDataPrimitiveType =
  SimDataNumber |
  SimDataBigInt |
  SimDataText |
  SimDataFloatVector |
  DataType.Boolean |
  DataType.ResourceKey;

/** Data types that contain recursive values. */
export type SimDataRecursiveType =
  DataType.Object |
  DataType.Variant |
  DataType.Vector;
