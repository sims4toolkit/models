import { BinaryDecoder } from "@s4tk/encoding";
import { makeList, pascalToCamel } from "../../../common/helpers";
import { BinaryFileReadingOptions } from "../../../common/options";
import { ObjectDefinitionDto, ObjectDefinitionProperties, ObjectDefinitionPropertyType } from "../types";

/**
 * Reads a buffer as an object definition and returns a DTO.
 * 
 * @param buffer Buffer to read as an object definition
 * @param options Options for reading this definition
 */
export default function readObjDef(
  buffer: Buffer,
  options?: BinaryFileReadingOptions
): ObjectDefinitionDto {
  const decoder = new BinaryDecoder(buffer);

  const version = decoder.uint16();
  if (version !== 2 && !options?.recoveryMode)
    throw new Error("Expected object definition version to be 2.");

  const tablePosition = decoder.uint32();
  decoder.seek(tablePosition);
  const entryCount = decoder.uint16();
  const properties: ObjectDefinitionProperties = {};
  for (let i = 0; i < entryCount; ++i) {
    const type = decoder.uint32();
    const offset = decoder.uint32();

    if (type in ObjectDefinitionPropertyType) {
      const propKey = pascalToCamel(ObjectDefinitionPropertyType[type]);
      properties[propKey] = decoder.savePos(() => {
        decoder.seek(offset);
        return getPropertyValue(type, decoder);
      });
    } else if (properties.unknownMisc) {
      properties.unknownMisc.add(type);
    } else {
      properties.unknownMisc = new Set([type]);
    }
  }

  return { version, properties };
}

//#region Helpers

/**
 * Reads the appropriate value for the given type from the given decoder.
 * 
 * @param type Type to get value for
 * @param decoder Decoder from which to read value
 */
function getPropertyValue(
  type: ObjectDefinitionPropertyType,
  decoder: BinaryDecoder
): any {
  switch (type) {
    case ObjectDefinitionPropertyType.Name:
    case ObjectDefinitionPropertyType.Tuning:
    case ObjectDefinitionPropertyType.MaterialVariant:
      return decoder.slice(decoder.uint32()).toString();
    case ObjectDefinitionPropertyType.TuningId:
    case ObjectDefinitionPropertyType.Unknown3:
      return decoder.uint64();
    case ObjectDefinitionPropertyType.Icon:
    case ObjectDefinitionPropertyType.Rig:
    case ObjectDefinitionPropertyType.Slot:
    case ObjectDefinitionPropertyType.Model:
    case ObjectDefinitionPropertyType.Footprint:
      return makeList(decoder.int32() / 4, () => {
        const instanceP1 = decoder.uint32();
        const instanceP2 = decoder.uint32();
        const instance = (BigInt(instanceP1) << 32n) + BigInt(instanceP2);
        const type = decoder.uint32();
        const group = decoder.uint32();
        return { type, group, instance };
      });
    case ObjectDefinitionPropertyType.Components:
      return makeList(decoder.int32(), () => {
        return decoder.uint32()
      });
    case ObjectDefinitionPropertyType.Unknown1:
    case ObjectDefinitionPropertyType.Unknown2:
      return decoder.byte();
    case ObjectDefinitionPropertyType.SimoleonPrice:
    case ObjectDefinitionPropertyType.ThumbnailGeometryState:
      return decoder.uint32();
    case ObjectDefinitionPropertyType.PositiveEnvironmentScore:
    case ObjectDefinitionPropertyType.NegativeEnvironmentScore:
      return decoder.float();
    case ObjectDefinitionPropertyType.EnvironmentScoreEmotionTags:
      return makeList(decoder.int32(), () => {
        return decoder.uint16()
      });
    case ObjectDefinitionPropertyType.EnvironmentScoreEmotionTags_32:
      return makeList(decoder.int32(), () => {
        return decoder.uint32()
      });
    case ObjectDefinitionPropertyType.EnvironmentScores:
      return makeList(decoder.uint32(), () => {
        return decoder.float()
      });
    case ObjectDefinitionPropertyType.IsBaby:
      return decoder.boolean();
    case ObjectDefinitionPropertyType.Unknown4:
      return makeList(decoder.uint32(), () => {
        return decoder.byte()
      });
    default:
      throw new Error(`Object Definition Type "${type}" not recognized. This error should never be thrown, so if you're reading this, please report the error ASAP.`);
  }
}

//#endregion Helpers
