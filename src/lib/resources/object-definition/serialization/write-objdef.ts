import { BinaryEncoder } from "@s4tk/encoding";
import { BinaryFileReadingOptions } from "../../../common/options";
import { ResourceKey } from "../../../packages/types";
import { ObjectDefinitionDto, ObjectDefinitionProperty, ObjectDefinitionPropertyType } from "../types";

/**
 * TODO:
 * 
 * @param dto TODO:
 * @param options TODO:
 */
export default function writeObjDef(
  dto: ObjectDefinitionDto,
  options?: BinaryFileReadingOptions
): Buffer {
  const propertyBuffers: Buffer[] = [];
  const tableEncoder = BinaryEncoder.alloc(dto.properties.length * 8 + 2);

  let currentOffset = 6;
  tableEncoder.uint16(dto.properties.length);
  dto.properties.forEach(prop => {
    tableEncoder.uint32(prop.type);
    tableEncoder.uint32(currentOffset);
    const valueBuffer = writeProp(prop);
    propertyBuffers.push(valueBuffer);
    currentOffset += valueBuffer.length;
  });

  const propertiesBuffer = Buffer.concat(propertyBuffers);
  const headerEncoder = BinaryEncoder.alloc(6);
  headerEncoder.uint16(2);
  headerEncoder.uint32(propertiesBuffer.length + 6);

  return Buffer.concat([
    headerEncoder.buffer,
    propertiesBuffer,
    tableEncoder.buffer
  ]);
}

function writeProp(prop: ObjectDefinitionProperty): Buffer {
  let encoder: BinaryEncoder;
  let length: number;

  switch (prop.type) {
    case ObjectDefinitionPropertyType.Name:
    case ObjectDefinitionPropertyType.Tuning:
    case ObjectDefinitionPropertyType.MaterialVariant:
      length = Buffer.byteLength(prop.value as string)
      encoder = BinaryEncoder.alloc(length + 4);
      encoder.uint32(length);
      encoder.charsUtf8(prop.value as string);
      break;
    case ObjectDefinitionPropertyType.TuningID:
    case ObjectDefinitionPropertyType.Unknown3:
      encoder = BinaryEncoder.alloc(8);
      encoder.uint64(prop.value as bigint);
      break;
    case ObjectDefinitionPropertyType.Icon:
    case ObjectDefinitionPropertyType.Rig:
    case ObjectDefinitionPropertyType.Slot:
    case ObjectDefinitionPropertyType.Model:
    case ObjectDefinitionPropertyType.Footprint:
      length = (prop.value as Array<ResourceKey>).length;
      encoder = BinaryEncoder.alloc(length * 16 + 4);
      encoder.int32(length * 4);
      (prop.value as Array<ResourceKey>).forEach(key => {
        encoder.uint32(Number(key.instance >> 32n)); // FIXME: idk
        encoder.uint32(Number(key.instance & 0xFFFFFFFFn)); // FIXME: idk
        encoder.uint32(key.type);
        encoder.uint32(key.group);
      });
      break;
    case ObjectDefinitionPropertyType.Components:
      length = (prop.value as Array<number>).length;
      encoder = BinaryEncoder.alloc(length + 4);
      encoder.int32(length);
      (prop.value as Array<number>).forEach(n => {
        encoder.uint32(n);
      });
      break;
    case ObjectDefinitionPropertyType.Unknown1:
    case ObjectDefinitionPropertyType.Unknown2:
      encoder = BinaryEncoder.alloc(1);
      encoder.byte(prop.value as number);
      break;
    case ObjectDefinitionPropertyType.SimoleonPrice:
    case ObjectDefinitionPropertyType.ThumbnailGeometryState:
      encoder = BinaryEncoder.alloc(4);
      encoder.uint32(prop.value as number);
      break;
    case ObjectDefinitionPropertyType.PositiveEnvironmentScore:
    case ObjectDefinitionPropertyType.NegativeEnvironmentScore:
      encoder = BinaryEncoder.alloc(4);
      encoder.float(prop.value as number);
      break;
    case ObjectDefinitionPropertyType.EnvironmentScoreEmotionTags:
      length = (prop.value as Array<number>).length;
      encoder = BinaryEncoder.alloc(length + 4);
      encoder.int32(length);
      (prop.value as Array<number>).forEach(n => {
        encoder.uint16(n);
      });
      break;
    case ObjectDefinitionPropertyType.EnvironmentScores:
      length = (prop.value as Array<number>).length;
      encoder = BinaryEncoder.alloc(length + 4);
      encoder.uint32(length);
      (prop.value as Array<number>).forEach(f => {
        encoder.float(f);
      });
      break;
    case ObjectDefinitionPropertyType.IsBaby:
      encoder = BinaryEncoder.alloc(1);
      encoder.boolean(prop.value as boolean);
      break;
    case ObjectDefinitionPropertyType.Unknown4:
      length = (prop.value as Array<number>).length;
      encoder = BinaryEncoder.alloc(length + 4);
      encoder.uint32(length);
      (prop.value as Array<number>).forEach(b => {
        encoder.byte(b);
      });
      break;
    default:
      throw new Error("Type not recognized"); // FIXME: throw type and check if recovery mode
  }

  return encoder.buffer;
}
