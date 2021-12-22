import type { SimDataSchema } from "./fragments";
import { SimDataType } from "./simDataTypes";

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

interface Cell {
  dataType: SimDataType;
}

interface StringCell extends Cell {
  dataType: SimDataString;
  value: string;
}

interface NumberCell extends Cell {
  dataType: SimDataNumber;
  value: number;
}

interface BigIntCell extends Cell {
  dataType: SimDataBigInt;
  value: bigint;
}

interface ResourceKeyCell extends Cell {
  dataType: SimDataType.ResourceKey;
  type: number;
  group: number;
  instance: bigint;
}

interface Float2Cell extends Cell {
  dataType: SimDataType.Float2;
  x: number;
  y: number;
}

interface Float3Cell extends Cell {
  dataType: SimDataType.Float3;
  x: number;
  y: number;
  z: number;
}

interface Float4Cell extends Cell {
  dataType: SimDataType.Float4;
  x: number;
  y: number;
  z: number;
  w: number;
}

interface ObjectCell extends Cell {
  dataType: SimDataType.Object;
  schema: SimDataSchema;
  rows: Cell[];
}

interface VectorCell<T extends Cell> extends Cell {
  dataType: SimDataType.Vector;
  children: T[];
}

interface VariantCell<T extends Cell> extends Cell {
  dataType: SimDataType.Variant;
  child?: T;
}
