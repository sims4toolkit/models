/**
 * Types for tuning resources (i.e. any XML resource that is loaded as tuning).
 */
enum TuningResourceType {
  Buff = 0x6017E896,
  Trait = 0xCB5FDDC7,
}

// `export default enum` not supported by TS
export default TuningResourceType;
