import { BinaryEncoder } from "@s4tk/encoding";
import { camelToPascal } from "../../../common/helpers";
import { ResourceKey } from "../../../packages/types";
import { ObjectDefinitionDto, ObjectDefinitionType } from "../types";

/**
 * Writes an obj def DTO into a buffer.
 * 
 * @param dto Obj def DTO to write
 */
export default function writeObjDef(dto: ObjectDefinitionDto): Buffer {
  const props: PropertyPair[] = [];
  for (const propKey in dto.properties) {
    const enumName = camelToPascal(propKey);
    if (enumName in ObjectDefinitionType) {
      const type = ObjectDefinitionType[enumName];
      props.push({ type, value: dto.properties[propKey] });
    }
  }

  const propertyBuffers: Buffer[] = [];
  const tableEncoder = BinaryEncoder.alloc(props.length * 8 + 2);

  let currentOffset = 6;
  tableEncoder.uint16(props.length);
  props.forEach(prop => {
    tableEncoder.uint32(prop.type);
    tableEncoder.uint32(currentOffset);
    const valueBuffer = writeProp(prop);
    propertyBuffers.push(valueBuffer);
    currentOffset += valueBuffer.length;
  });

  const propertiesBuffer = Buffer.concat(propertyBuffers);
  const headerEncoder = BinaryEncoder.alloc(6);
  headerEncoder.uint16(dto.version);
  headerEncoder.uint32(propertiesBuffer.length + 6);

  return Buffer.concat([
    headerEncoder.buffer,
    propertiesBuffer,
    tableEncoder.buffer
  ]);
}

//#region Helpers

/**
 * Returns a buffer that contains data for the given property pair.
 * 
 * @param prop Type/value pair to write
 */
function writeProp(prop: PropertyPair): Buffer {
  let encoder: BinaryEncoder;
  let length: number;

  // NOTE: Some properties use uint32s for their length, others use int32s -
  // this is intentional, as this is how S4PE does it

  switch (prop.type) {
    case ObjectDefinitionType.Name:
    case ObjectDefinitionType.Tuning:
    case ObjectDefinitionType.MaterialVariant:
      length = Buffer.byteLength(prop.value as string)
      encoder = BinaryEncoder.alloc(length + 4);
      encoder.uint32(length); // string length
      encoder.charsUtf8(prop.value as string);
      break;
    case ObjectDefinitionType.TuningId:
    case ObjectDefinitionType.Unknown3:
      encoder = BinaryEncoder.alloc(8);
      encoder.uint64(prop.value as bigint);
      break;
    case ObjectDefinitionType.Icons:
    case ObjectDefinitionType.Rigs:
    case ObjectDefinitionType.Slots:
    case ObjectDefinitionType.Models:
    case ObjectDefinitionType.Footprints:
      length = (prop.value as Array<ResourceKey>).length;
      encoder = BinaryEncoder.alloc(length * 16 + 4);
      encoder.int32(length * 4); // num keys
      (prop.value as Array<ResourceKey>).forEach(key => {
        encoder.uint32(Number(key.instance >> 32n));
        encoder.uint32(Number(key.instance & 0xFFFFFFFFn));
        encoder.uint32(key.type);
        encoder.uint32(key.group);
      });
      break;
    case ObjectDefinitionType.Components:
      length = (prop.value as Array<number>).length;
      encoder = BinaryEncoder.alloc(length * 4 + 4);
      encoder.int32(length); // num components
      (prop.value as Array<number>).forEach(n => {
        encoder.uint32(n);
      });
      break;
    case ObjectDefinitionType.Unknown1:
    case ObjectDefinitionType.Unknown2:
      encoder = BinaryEncoder.alloc(1);
      encoder.byte(prop.value as number);
      break;
    case ObjectDefinitionType.SimoleonPrice:
    case ObjectDefinitionType.ThumbnailGeometryState:
      encoder = BinaryEncoder.alloc(4);
      encoder.uint32(prop.value as number);
      break;
    case ObjectDefinitionType.PositiveEnvironmentScore:
    case ObjectDefinitionType.NegativeEnvironmentScore:
      encoder = BinaryEncoder.alloc(4);
      encoder.float(prop.value as number);
      break;
    case ObjectDefinitionType.EnvironmentScoreEmotionTags:
      length = (prop.value as Array<number>).length;
      encoder = BinaryEncoder.alloc(length * 2 + 4);
      encoder.int32(length); // count
      (prop.value as Array<number>).forEach(n => {
        encoder.uint16(n);
      });
      break;
    case ObjectDefinitionType.EnvironmentScoreEmotionTags_32:
      length = (prop.value as Array<number>).length;
      encoder = BinaryEncoder.alloc(length * 4 + 4);
      encoder.int32(length); // count
      (prop.value as Array<number>).forEach(n => {
        encoder.uint32(n);
      });
      break;
    case ObjectDefinitionType.EnvironmentScores:
      length = (prop.value as Array<number>).length;
      encoder = BinaryEncoder.alloc(length * 4 + 4);
      encoder.uint32(length); // count
      (prop.value as Array<number>).forEach(f => {
        encoder.float(f);
      });
      break;
    case ObjectDefinitionType.IsBaby:
      encoder = BinaryEncoder.alloc(1);
      encoder.boolean(prop.value as boolean);
      break;
    case ObjectDefinitionType.Unknown4:
      length = (prop.value as Array<number>).length;
      encoder = BinaryEncoder.alloc(length + 4);
      encoder.uint32(length); // count
      (prop.value as Array<number>).forEach(b => {
        encoder.byte(b);
      });
      break;
    default:
      throw new Error(`Object Definition Type "${prop.type}" not recognized. This error should never be thrown, so if you're reading this, please report the error ASAP.`);
  }

  return encoder.buffer;
}

//#endregion Helpers

//#region Types

interface PropertyPair {
  type: ObjectDefinitionType;
  value: any;
}

//#endregion Types
