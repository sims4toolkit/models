/**
 * A DTO for object definition resources.
 */
export interface ObjectDefinitionDto {
  version: number;
  properties: ObjectDefinitionProperty[];
}

/**
 * A pairing of an object definition type and its value.
 */
export interface ObjectDefinitionProperty {
  type: ObjectDefinitionPropertyType;
  value: unknown;
}

/**
 * Types of properties in an object definition.
 */
export enum ObjectDefinitionPropertyType {
  Components = 0xE6E421FB,
  EnvironmentScoreEmotionTags = 0x2172AEBE,
  EnvironmentScores = 0xDCD08394,
  Footprint = 0x6C737AD8,
  Icon = 0xCADED888,
  IsBaby = 0xAEE67A1C,
  MaterialVariant = 0xECD5A95F,
  Model = 0x8D20ACC6,
  Name = 0xE7F07786,
  NegativeEnvironmentScore = 0x44FC7512,
  PositiveEnvironmentScore = 0x7236BEEA,
  Rig = 0xE206AE4F,
  SimoleonPrice = 0xE4F4FAA4,
  Slot = 0x8A85AFF3,
  ThumbnailGeometryState = 0x4233F8A0,
  Tuning = 0x790FA4BC,
  TuningID = 0xB994039B,
  Unknown1 = 0xAC8E1BC0,
  Unknown2 = 0xEC3712E6,
  Unknown3 = 0x52F7F4BC,
  Unknown4 = 0xF3936A90,
}
