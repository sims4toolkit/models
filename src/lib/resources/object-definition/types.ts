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
export enum ObjectDefinitionPropertyType {
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
 * A mapping of property names to values. These names align with the enum,
 * except for `UnknownMisc` which is just a set of all types that are not 
 * recognized by S4TK.
 */
export type ObjectDefinitionProperties = Partial<{
  Components: number[]; // uint32[]
  EnvironmentScoreEmotionTags: number[]; // uint16
  EnvironmentScoreEmotionTags_32: number[]; // uint32
  EnvironmentScores: number[]; // float[]
  Footprint: ResourceKey;
  Icon: ResourceKey;
  IsBaby: boolean; // byte
  MaterialVariant: string;
  Model: ResourceKey;
  Name: string;
  NegativeEnvironmentScore: number; // float
  PositiveEnvironmentScore: number; // float
  Rig: ResourceKey;
  SimoleonPrice: number; // uint32
  Slot: ResourceKey;
  ThumbnailGeometryState: number; // uint32
  Tuning: string;
  TuningId: bigint; // uint64
  Unknown1: number; // byte
  Unknown2: number; // byte
  Unknown3: bigint; // bigint
  Unknown4: number[]; // byte[]
  UnknownMisc: Set<number>;
}>;
