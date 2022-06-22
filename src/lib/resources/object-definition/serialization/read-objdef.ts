import { BinaryDecoder } from "@s4tk/encoding";
import { makeList, pascalToCamel } from "../../../common/helpers";
import { BinaryFileReadingOptions } from "../../../common/options";
import { ObjectDefinitionDto, ObjectDefinitionProperties, ObjectDefinitionType } from "../types";

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

    if (type in ObjectDefinitionType) {
      const propKey = pascalToCamel(ObjectDefinitionType[type]);
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
  type: ObjectDefinitionType,
  decoder: BinaryDecoder
): any {
  switch (type) {
    case ObjectDefinitionType.Name:
    case ObjectDefinitionType.Tuning:
    case ObjectDefinitionType.MaterialVariant:
      return decoder.slice(decoder.uint32()).toString();
    case ObjectDefinitionType.TuningId:
    case ObjectDefinitionType.Unknown3:
      return decoder.uint64();
    case ObjectDefinitionType.Icon:
    case ObjectDefinitionType.Rig:
    case ObjectDefinitionType.Slot:
    case ObjectDefinitionType.Model:
    case ObjectDefinitionType.Footprint:
      return makeList(decoder.int32() / 4, () => {
        const instanceP1 = decoder.uint32();
        const instanceP2 = decoder.uint32();
        const instance = (BigInt(instanceP1) << 32n) + BigInt(instanceP2);
        const type = decoder.uint32();
        const group = decoder.uint32();
        return { type, group, instance };
      });
    case ObjectDefinitionType.Components:
      return makeList(decoder.int32(), () => {
        return decoder.uint32()
      });
    case ObjectDefinitionType.Unknown1:
    case ObjectDefinitionType.Unknown2:
      return decoder.byte();
    case ObjectDefinitionType.SimoleonPrice:
    case ObjectDefinitionType.ThumbnailGeometryState:
      return decoder.uint32();
    case ObjectDefinitionType.PositiveEnvironmentScore:
    case ObjectDefinitionType.NegativeEnvironmentScore:
      return decoder.float();
    case ObjectDefinitionType.EnvironmentScoreEmotionTags:
      return makeList(decoder.int32(), () => {
        return decoder.uint16()
      });
    case ObjectDefinitionType.EnvironmentScoreEmotionTags_32:
      return makeList(decoder.int32(), () => {
        return decoder.uint32()
      });
    case ObjectDefinitionType.EnvironmentScores:
      return makeList(decoder.uint32(), () => {
        return decoder.float()
      });
    case ObjectDefinitionType.IsBaby:
      return decoder.boolean();
    case ObjectDefinitionType.Unknown4:
      return makeList(decoder.uint32(), () => {
        return decoder.byte()
      });
    default:
      throw new Error(`Object Definition Type "${type}" not recognized. This error should never be thrown, so if you're reading this, please report the error ASAP.`);
  }
}

//#endregion Helpers
