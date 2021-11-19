export type ResourceType = BinaryResourceType | TuningResourceType;

export enum BinaryResourceType {
  SimData = 0x545AC67A,
  StringTable = 0x220557DA,
}

export enum TuningResourceType {
  Buff = 0x6017E896,
  Trait = 0xCB5FDDC7,
}
