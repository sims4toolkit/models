import type { ResourceKey } from "../../packages/types";

/**
 * A DTO for object definition resources.
 */
export interface ObjectDefinitionDto {
  version: number;
  properties: ObjectDefinitionProperties;
}

/**
 * Types of properties in an object definition.
 */
export enum ObjectDefinitionType {
  Components = 0xE6E421FB,
  EnvironmentScoreEmotionTags = 0x2172AEBE,
  EnvironmentScoreEmotionTags_32 = 0x2143974C,
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
  TuningId = 0xB994039B,
  Unknown1 = 0xAC8E1BC0,
  Unknown2 = 0xEC3712E6,
  Unknown3 = 0x52F7F4BC,
  Unknown4 = 0xF3936A90,
}

/**
 * A mapping of property keys to values. Property keys are the camel case
 * equivalent to their associated types in ObjectDefinitionType,
 * except for `unknownMisc` which keeps track of types not in the enum.
 */
export type ObjectDefinitionProperties = Partial<{
  components: number[]; // uint32[]
  environmentScoreEmotionTags: number[]; // uint16
  environmentScoreEmotionTags_32: number[]; // uint32
  environmentScores: number[]; // float[]
  footprint: ResourceKey;
  icon: ResourceKey;
  isBaby: boolean; // byte
  materialVariant: string;
  model: ResourceKey;
  name: string;
  negativeEnvironmentScore: number; // float
  positiveEnvironmentScore: number; // float
  rig: ResourceKey;
  simoleonPrice: number; // uint32
  slot: ResourceKey;
  thumbnailGeometryState: number; // uint32
  tuning: string;
  tuningId: bigint; // uint64
  unknown1: number; // byte
  unknown2: number; // byte
  unknown3: bigint; // bigint
  unknown4: number[]; // byte[]
  unknownMisc: Set<number>;
}>;
