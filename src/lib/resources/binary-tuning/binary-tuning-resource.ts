import Resource from "../resource";
import { BinaryTuningDto } from "./types";

/**
 * TODO:
 */
export default class BinaryTuningResource extends Resource {
  readonly variant = "DATA";
  public data: BinaryTuningDto;

  static from(buffer: Buffer): BinaryTuningResource {
    // TODO:
    return;
  }
  
  clone(): Resource {
    throw new Error("Method not implemented.");
  }

  protected _serialize(): Buffer {
    throw new Error("Method not implemented.");
  }
}
