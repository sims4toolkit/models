import { getAllEnumValues, pascalToSnake, snakeToPascal } from "../common/helpers";

/**
 * Types for tuning resources (i.e. any XML resource that is loaded as tuning).
 */
enum TuningResourceType {
  Achievement = 0x78559E9E,
  AchievementCategory = 0x2451C101,
  AchievementCollection = 0x04D2B465,
  Action = 0x0C772E27,
  Animation = 0xEE17C6AD,
  AspirationCategory = 0xE350DBD8,
  AspirationTrack = 0xC020FCAD,
  Aspiration = 0x28B64675,
  AwayAction = 0xAFADAC48,
  Balloon = 0xEC6A8FC6,
  Breed = 0x341D3F25,
  Broadcaster = 0xDEBAFB73,
  BucksPerk = 0xEC3DA10E,
  Buff = 0x6017E896,
  Business = 0x75D807F3,
  CasMenuItem = 0x0CBA50F4,
  CasMenu = 0x935A83C2,
  CasPreferenceCategory = 0xCE04FC4B,
  CasPreferenceItem = 0xEC68FD22,
  CasStoriesAnswer = 0x80F12D17,
  CasStoriesQuestion = 0x03246B9D,
  CasStoriesTraitChooser = 0x8DAD1549,
  CallToAction = 0xF537B2E0,
  CareerEvent = 0x94420322,
  CareerGig = 0xCCDB0EDD,
  CareerLevel = 0x2C70ADF8,
  CareerTrack = 0x48C75CE3,
  Career = 0x73996BEB,
  Clan = 0xDEBEE6A5,
  ClanValue = 0x998ED0AB,
  ClubInteractionGroup = 0xFA0FFA34,
  ClubSeed = 0x2F59B437,
  ConditionalLayer = 0x9183DC91,
  DetectiveClue = 0x537449F6,
  DevelopmentalMilestone = 0xC5224F94,
  DramaNode = 0x2553F435,
  Ensemble = 0xB9881120,
  GameRuleset = 0xE1477E18,
  Headline = 0xF401205D,
  HolidayDefinition = 0x0E316F6D,
  HolidayTradition = 0x3FCD2486,
  HouseholdMilestone = 0x3972E6F3,
  Interaction = 0xE882D22F,
  LotDecorationPreset = 0xDE1EF8FB,
  LotDecoration = 0xFE2DB1AB,
  LotTuning = 0xD8800D66,
  Mood = 0xBA7B60B8,
  Narrative = 0x3E753C39,
  NotebookEntry = 0x9902FA76,
  ObjectPart = 0x7147A350,
  ObjectState = 0x5B02819E,
  Object = 0xB61DE6B4,
  Objective = 0x0069453E,
  OpenStreetDirector = 0x4B6FDEC4,
  PieMenuCategory = 0x03E9D964,
  Posture = 0xAD6FDF1F,
  RabbitHole = 0xB16AD2FA,
  Recipe = 0xEB97F823,
  Region = 0x51E7A18D,
  RelationshipBit = 0x0904DF10,
  RelationshipLock = 0xAE34E673,
  Reward = 0x6FA49828,
  RoleState = 0x0E4D15FB,
  Royalty = 0x37EF2EE7,
  Season = 0xC98DD45E,
  ServiceNpc = 0x9CC21262,
  Sickness = 0xC3FBD8DE,
  SimFilter = 0x6E0DDA9F,
  SimInfoFixup = 0xE2581892,
  SimTemplate = 0x0CA4C78B,
  SituationGoalSet = 0x9DF2F1F2,
  SituationGoal = 0x598F28E7,
  SituationJob = 0x9C07855F,
  Situation = 0xFBC3AEEB,
  SlotTypeSet = 0x3F163505,
  SlotType = 0x69A5DAA4,
  Snippet = 0x7DF2169C,
  SocialGroup = 0x2E47A104,
  Spell = 0x1F3413D9,
  Scommodity = 0x51077643,
  Statistic = 0x339BC5BD,
  Strategy = 0x6224C9D6,
  Street = 0xF6E4CB00,
  Subroot = 0xB7FF8F95,
  TagSet = 0x49395302,
  TemplateChooser = 0x48C2D5ED,
  TestBasedScore = 0x4F739CEE,
  Topic = 0x738E6C56,
  Trait = 0xCB5FDDC7,
  Tuning = 0x03B33DDF,
  TutorialTip = 0x8FB3E0B1,
  Tutorial = 0xE04A24A3,
  UniversityCourseData = 0x291CAFBE,
  UniversityMajor = 0x2758B34B,
  University = 0xD958D5B1,
  UserInterfaceInfo = 0xB8BF1A63,
  Venue = 0xE6BBD7DE,
  WalkBy = 0x3FD6243E,
  WeatherEvent = 0x5806F5BA,
  WeatherForecast = 0x497F3271,
  Whim = 0x749A0636,
  ZoneDirector = 0xF958A092,
  ZoneModifier = 0x3C1D8799,
}

namespace TuningResourceType {
  /**
   * Returns an array of all tuning resource types.
   */
  export function all(): TuningResourceType[] {
    return getAllEnumValues(TuningResourceType);
  }

  /**
   * Returns the TuningResourceType value for tunings with the given type
   * attribute. This attribute is either the `n` in R nodes in combined
   * tuning, or the `i` in regular tuning instances. If there is no type for
   * the given attribute, `Tuning` is assumed.
   *
   * @param attr Attribute to parse as a tuning type
   */
  export function parseAttr(attr: string): TuningResourceType {
    switch (attr) {
      // special cases must be added to this enum manually
      case "relbit": return TuningResourceType.RelationshipBit;
      default:
        const enumName = snakeToPascal(attr);
        const enumValue = TuningResourceType[enumName];
        return enumValue ?? TuningResourceType.Tuning;
    }
  }

  /**
   * Returns the `i` attribute to use for a tuning file of the given type. If
   * there is no attribute for the given type, result is null.
   *
   * @param type Tuning type to get attribute for
   */
  export function getAttr(type: TuningResourceType): string {
    switch (type) {
      // special cases must be added to this enum manually
      case TuningResourceType.Tuning: return null;
      case TuningResourceType.RelationshipBit: return "relbit";
      default:
        return (type in TuningResourceType)
          ? pascalToSnake(TuningResourceType[type])
          : null;
    }
  }
}

// `export default enum` not supported by TS
export default TuningResourceType;
