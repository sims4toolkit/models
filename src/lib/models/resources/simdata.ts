import Resource from "./resource";
import { BinaryEncoder, BinaryDecoder } from "../../utils/encoding";

/**
 * A resource that contains binary tuning (SimData).
 */
export default class SimDataResource extends Resource {
  readonly variant = 'DATA';

  //#region Initialization

  private constructor(buffer?: Buffer) {
    super({ buffer });
    // TODO: read buffer as simdata
  }

  clone(): SimDataResource {
    return undefined;
  }

  static from(buffer: Buffer): SimDataResource {
    return 
  }

  //#endregion Initialization

  protected _serialize(): Buffer {
    return undefined; // TODO: impl
  }
}
