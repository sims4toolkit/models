import WritableModel from "../../base/writable-model";
import { bufferContainsXml } from "../../common/helpers";
import EncodingType from "../../enums/encoding-type";
import Resource from "../resource";
import readData from "./serialization/read-data";
import { BinaryTuningDto } from "./types";

/**
 * Read-only model for binary tuning. Note that binary tuning uses the same
 * format as SimData, but is not supported by the SimDataResource model. 
 */
export default class BinaryTuningResource extends WritableModel implements Resource {
  readonly encodingType: EncodingType = EncodingType.DATA;

  get saveBuffer() { return true; }
  set saveBuffer(saveBuffer: boolean) {
    // intentionally blank; binary tuning must always have a buffer
  }

  protected constructor(public data: BinaryTuningDto, buffer: Buffer) {
    super(true, buffer);
  }
  
  static from(buffer: Buffer): BinaryTuningResource {
    if (bufferContainsXml(buffer))
      throw new Error(`Parsing BinaryTuningResource from XML is currently unsupported. Please provide binary input.`);
    return new BinaryTuningResource(readData(buffer), buffer);
  }
  
  clone(): Resource {
    throw new Error("Cloning BinaryTuningResource is not supported. If you are trying to clone a SimData, use the SimDataResource model instead.");
  }

  equals(other: any): boolean {
    throw new Error("Comparing BinaryTuningResource is not supported. If you are trying to compare SimDatas, use the SimDataResource model instead.");
  }
  
  isXml(): boolean {
    return false; // FIXME: it can be true when XML is supported
  }

  protected _serialize(): Buffer {
    throw new Error("Serializing BinaryTuningResource is not supported. If you are trying to serialize a SimData, use the SimDataResource model instead.");
  }
}
