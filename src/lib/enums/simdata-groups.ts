import TuningResourceType from "./tuning-resources";

/**
 * Groups for SimDatas.
 */
enum SimDataGroup {
  Buff = 0x1,
  Trait = 0x2
}

namespace SimDataGroup {
  /**
   * Returns the SimDataGroup to use for the given tuning type. The given value
   * does not have to be from the enum, it can also be the plain number.
   * 
   * For example, to get the group for a trait, you can do either:
   * ```ts
   * getForTuning(TuningResourceType.Trait)
   * getForTuning(0xCB5FDDC7)
   * ```
   * 
   * @param tuningType Tuning type to get SimData group for
   */
  export function getForTuning(tuningType: TuningResourceType): SimDataGroup {
    return SimDataGroup[TuningResourceType[tuningType]];
  }
}

// `export default enum` not supported by TS
export default SimDataGroup;
