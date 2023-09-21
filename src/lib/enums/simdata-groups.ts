import { getAllEnumValues } from "../common/helpers";
import TuningResourceType from "./tuning-resources";

/**
 * Groups for SimDatas.
 */
enum SimDataGroup {
  Achievement = 0x00559EE6,
  AchievementCategory = 0x0051C125,
  AchievementCollection = 0x00D2B461,
  Aspiration = 0x00B6465D,
  AspirationCategory = 0x0050DB3B,
  AspirationTrack = 0x0020FC6D,
  Automation = 0x00D16262, // No tuning type
  Breed = 0x001D3F11,
  Buff = 0x0017E8F6,
  BuildBuy = 0x0003C397, // No tuning type
  Business = 0x00D80786,
  Career = 0x00996B98,
  CareerGig = 0x00DB0E11,
  CareerLevel = 0x0070ADD4,
  CareerTrack = 0x00C75CAB,
  CasMenu = 0x005A8351,
  CasMenuItem = 0x00BA50F8,
  CasOccultSkintone = 0x00C36C35, // uses TuningResourceType.Tuning
  CasPreferenceCategory = 0x0004FC85,
  CasPreferenceItem = 0x0068FDCE,
  CasStoriesAnswer = 0x00F12D97,
  CasStoriesQuestion = 0x00246B9E,
  CasStoriesTraitChooser = 0x00AD15C4,
  Clan = 0x00BEE67B,
  ClanValue = 0x008ED032,
  ClientCasCameraTuning = 0x005ADEC7, // No tuning type
  ClientCasLighting = 0x000A3610, // No tuning type
  ClientCasModifierTuning = 0x00ABFFCF, // No tuning type
  ClientCasOccultTuning = 0x009769C8, // No tuning type
  ClientCasThumbnailCamera = 0x00496642, // No tuning type
  ClientCasThumbnailPartTuning = 0x00D1D002, // No tuning type
  ClientCasTuning = 0x004B5265, // No tuning type
  ClientRegionSortTuning = 0x0057C8BA, // No tuning type
  ClientTagCategoriesMetadata = 0x0012D444, // No tuning type
  ClientTags = 0x00B98960, // No tuning type
  ClientTagsMapping = 0x00057D11, // No tuning type
  ClientTagsTraitGroupMetadata = 0x003E4215, // No tuning type
  ClientThumbnailPoses = 0x00C27C36, // No tuning type
  ClientTutorial = 0x0073074B, // No tuning type
  ClubInteractionGroup = 0x000FFACE,
  ClubSeed = 0x0059B418,
  DevelopmentalMilestone = 0x00224F51,
  DramaNode = 0x0053F410,
  GuidanceTip = 0x00A09A69,
  Headline = 0x000120A9,
  HolidayTradition = 0x00CD24B9,
  HouseholdMilestone = 0x0072E6CA,
  LotDecorationPreset = 0x001EF825,
  Module = 0x006CA304, // uses TuningResourceType.Tuning
  Mood = 0x007B6002,
  NativeBuildBuy = 0x0094E9AE, // No tuning type
  NativeSeasonsWeather = 0x003A5A65, // No tuning type
  Objective = 0x0069453E,
  PieMenuCategory = 0x00E9D967,
  Recipe = 0x0097F8C8,
  Region = 0x00E7A1DC,
  RelationshipBit = 0x004DFB84,
  RendererCas = 0x00295874, // No tuning type
  RendererHsvTweakerSettings = 0x00FC90DD, // No tuning type
  RendererMinspec = 0x001F95DE, // No tuning type
  Reward = 0x00A49847,
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
  UserInterfaceInfo = 0x00BF1ADB,
  Venue = 0x00BBD738,
  VideoPlaylist = 0x00BF458B, // No tuning type
  WeatherForecast = 0x007F3238,
  ZoneModifier = 0x001D87A5,
}

namespace SimDataGroup {
  /**
   * Returns an array of all SimData groups.
   */
  export function all(): SimDataGroup[] {
    return getAllEnumValues(SimDataGroup);
  }

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
