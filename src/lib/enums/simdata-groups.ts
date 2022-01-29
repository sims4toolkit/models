import TuningResourceType from "./tuning-resources";

/**
 * Groups for SimDatas.
 */
enum SimDataGroup {
  Achievement = 0x00559EE6,
  AchievementCollection = 0x00D2B461,
  Aspiration = 0x00B6465D,
  AspirationCategory = 0x0050DB3B,
  AspirationTrack = 0x0020FC6D,
  Breed = 0x001D3F11,
  Buff = 0x0017E8F6,
  Business = 0x00D80786,
  Career = 0x00996B98,
  CareerGig = 0x00DB0E11,
  CareerLevel = 0x0070ADD4,
  CasMenu = 0x005A8351,
  CasMenuItem = 0x00BA50F8,
  CasPreferenceCategory = 0x0004FC85,
  CasPreferenceItem = 0x0068FDCE,
  CasStoriesAnswer = 0x00F12D97,
  CasStoriesQuestion = 0x00246B9E,
  CasStoriesTraitChooser = 0x00AD15C4,
  ClubInteractionGroup = 0x000FFACE,
  ClubSeed = 0x0059B418,
  DramaNode = 0x0053F410,
  Headline = 0x000120A9,
  HolidayTradition = 0x00CD24B9,
  HouseholdMilestone = 0x0072E6CA,
  LotDecorationPreset = 0x001EF825,
  Mood = 0x007B6002,
  Objective = 0x0069453E,
  PieMenuCategory = 0x00E9D967,
  Recipe = 0x0097F8C8,
  Region = 0x00E7A1DC,
  RelationshipBit = 0x004DFB84,
  Season = 0x008DD497,
  SituationJob = 0x000785C3,
  SlotTypeSet = 0x0016353A,
  Snippet = 0x00F216E1,
  Spell = 0x003413C6,
  Statistic = 0x009BC58E,
  Street = 0x00E4CBF6,
  Subroot = 0x00FF8F22,
  Trait = 0x005FDD0C,
  Tutorial = 0x004A2443,
  TutorialTip = 0x00B3E03E,
  University = 0x0058D568,
  UniversityCourseData = 0x001CAF97,
  UniversityMajor = 0x0058B36C,
  Venue = 0x00BBD738,
  WeatherForecast = 0x007F3238,
  ZoneModifier = 0x001D87A5,
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
