import type { KeyStringPair, StblDto, StblHeader } from "../shared";
import type { SerializationOptions } from "../../../shared";
import { BinaryDecoder } from "@s4tk/encoding";

/**
 * Reads STBL content from the given buffer.
 * 
 * @param buffer Buffer to read as a STBL
 * @param options Options to configure
 */
export default function readStbl(buffer: Buffer, options?: SerializationOptions): StblDto {
  const decoder = new BinaryDecoder(buffer);

  const header: StblHeader = {};

  if (options === undefined || !options.ignoreErrors) {
    // mnFileIdentifier
    if (decoder.charsUtf8(4) !== "STBL")
      throw new Error("Not a string table.");

    // mnVersion
    header.version = decoder.uint16();
    if (header.version !== 5)
      throw new Error("Version must be 5.");
  } else {
    decoder.skip(4);
    header.version = decoder.uint16();
  }
  
  header.compressed = decoder.uint8(); // mnCompressed
  const mnNumEntries = decoder.uint64();
  header.reserved1 = decoder.uint8(); // mReserved[0]
  header.reserved2 = decoder.uint8(); // mReserved[1]
  decoder.skip(4); // mnStringLength (uint32; 4 bytes)

  const entries: KeyStringPair[] = [];
  for (let id = 0; id < mnNumEntries; id++) {
    const key = decoder.uint32();
    decoder.skip(1); // mnFlags (uint8; has no use, will never be set)
    const stringLength = decoder.uint16();
    const string = stringLength > 0 ? decoder.charsUtf8(stringLength) : '';
    entries.push({ key, value: string });
  }

  return { header, entries };
}
