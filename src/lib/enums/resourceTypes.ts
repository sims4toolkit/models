/**
 * Types for binary files.
 */
export enum BinaryResourceType {
  SimData = 0x545AC67A,
  StringTable = 0x220557DA,
}

/**
 * Types for tuning files.
 */
export enum TuningResourceType {
  Buff = 0x6017E896,
  Trait = 0xCB5FDDC7,
}

/**
 * Groups for SimDatas.
 */
export enum SimDataGroup {
  Buff = 0x0017E8F6,
  Trait = 0x005FDD0C
}
