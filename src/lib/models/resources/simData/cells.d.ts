import type { SimDataNumber, SimDataBigInt, SimDataString } from "./simDataTypes";
import { SimDataType } from "./simDataTypes";

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
  schemaHash: number;
  rows: Cell[];
}

interface VectorCell<T extends Cell> extends Cell {
  dataType: SimDataType.Vector;
  children: T[];
}

interface VariantCell<T extends Cell> extends Cell {
  dataType: SimDataType.Vector;
  child?: T;
}
