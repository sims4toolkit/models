import WritableModel from "../../base/writable-model";
import EncodingType from "../../enums/encoding-type";
import Resource from "../resource";
import { BinaryTuningDto } from "./types";

/**
 * TODO:
 */
export default class BinaryTuningResource extends WritableModel implements Resource {
  readonly encodingType: EncodingType = EncodingType.DATA;
  public data: BinaryTuningDto;
  
  static from(buffer: Buffer): BinaryTuningResource {
    // TODO:
    return;
  }
  
  clone(): Resource {
    throw new Error("Method not implemented.");
  }

  equals(other: any): boolean {
    throw new Error("Method not implemented.");
  }
  
  protected _serialize(): Buffer {
    throw new Error("Method not implemented.");
  }

  isXml(): boolean {
    return false; // FIXME: it might...
  }
}
