import WritableModel from "../../base/writable-model";
import { bufferContainsXml } from "../../common/helpers";
import { FileReadingOptions } from "../../common/options";
import CompressionType from "../../compression/compression-type";
import EncodingType from "../../enums/encoding-type";
import Resource from "../resource";
import readData from "./serialization/read-data";
import { CombinedTuningDto } from "./types";

/**
 * Read-only model for combined binary tuning. Note that combined binary tuning
 * uses the same binary format as SimData, but is not supported by the
 * SimDataResource model.
 */
export default class CombinedTuningResource extends WritableModel implements Resource {
  readonly encodingType: EncodingType = EncodingType.DATA;
  readonly compressionType: CompressionType = CompressionType.ZLIB;
  readonly isCompressed: boolean = false;

  get saveBuffer() { return true; }
  set saveBuffer(saveBuffer: boolean) {
    // intentionally blank; binary tuning must always have a buffer
  }

  protected constructor(public data: CombinedTuningDto, buffer: Buffer) {
    super(true, buffer);
  }
  
  static from(buffer: Buffer, options?: FileReadingOptions): CombinedTuningResource {
    if (bufferContainsXml(buffer))
      throw new Error(`Parsing CombinedTuningResource from XML is currently unsupported. If reading from a package, you should either filter out CombinedTuning or set loadErrorsAsRaw: true.`);
    return new CombinedTuningResource(readData(buffer, options), buffer);
  }
  
  clone(): Resource {
    throw new Error("Cloning CombinedTuningResource is not supported. If you are trying to clone a SimData, use the SimDataResource model instead.");
  }

  equals(other: any): boolean {
    throw new Error("Comparing CombinedTuningResource is not supported. If you are trying to compare SimDatas, use the SimDataResource model instead.");
  }
  
  isXml(): boolean {
    return false; // FIXME: it can be true when XML is supported
  }

  protected _serialize(): Buffer {
    throw new Error("Serializing CombinedTuningResource is not supported. If you are trying to serialize a SimData, use the SimDataResource model instead.");
  }
}
