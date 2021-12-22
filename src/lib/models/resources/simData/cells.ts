import type { SimDataSchema } from "./fragments";
import { SimDataType } from "./simDataTypes";

//#region SimDataType Groupings

type SimDataNumber = 
  SimDataType.Int8 |
  SimDataType.UInt8 |
  SimDataType.Int16 |
  SimDataType.UInt16 |
  SimDataType.Int32 |
  SimDataType.UInt32 |
  SimDataType.Float |
  SimDataType.LocalizationKey;

type SimDataBigInt = 
  SimDataType.Int64 |
  SimDataType.UInt64 |
  SimDataType.TableSetReference;

type SimDataString =
  SimDataType.Character |
  SimDataType.String |
  SimDataType.HashedString;

//#endregion SimDataType Groupings

//#region Cell Interfaces

export interface Cell {
  dataType: SimDataType;
}

export interface StringCell extends Cell {
  dataType: SimDataString;
  value: string;
}

export interface NumberCell extends Cell {
  dataType: SimDataNumber;
  value: number;
}

export interface BigIntCell extends Cell {
  dataType: SimDataBigInt;
  value: bigint;
}

export interface ResourceKeyCell extends Cell {
  dataType: SimDataType.ResourceKey;
  type: number;
  group: number;
  instance: bigint;
}

export interface Float2Cell extends Cell {
  dataType: SimDataType.Float2;
  x: number;
  y: number;
}

export interface Float3Cell extends Cell {
  dataType: SimDataType.Float3;
  x: number;
  y: number;
  z: number;
}

export interface Float4Cell extends Cell {
  dataType: SimDataType.Float4;
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface ObjectCell extends Cell {
  dataType: SimDataType.Object;
  schema: SimDataSchema;
  values: Cell[];
}

export interface VectorCell<T extends Cell> extends Cell {
  dataType: SimDataType.Vector;
  children: T[];
}

export interface VariantCell<T extends Cell> extends Cell {
  dataType: SimDataType.Variant;
  child?: T;
}

//#endregion Cell Interfaces
