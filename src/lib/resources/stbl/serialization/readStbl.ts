import type { KeyStringPair } from "../shared";
import type { SerializationOptions } from "../../../shared";
import { BinaryDecoder } from "@s4tk/encoding";

/**
 * Reads STBL content from the given buffer.
 * 
 * @param buffer Buffer to read as a STBL
 * @param options Options to configure
 */
export default function readStbl(buffer: Buffer, options?: SerializationOptions): KeyStringPair[] {
  const decoder = new BinaryDecoder(buffer);

  if (options === undefined || !options.ignoreErrors) {
    // mnFileIdentifier
    if (decoder.charsUtf8(4) !== "STBL")
      throw new Error("Not a string table.");

    // mnVersion
    if (decoder.uint16() !== 5)
      throw new Error("Version must be 5.");
  } else {
    decoder.skip(6);
  }
  
  decoder.skip(1); // mnCompressed
  const mnNumEntries = decoder.uint64();
  decoder.skip(2); // mReserved
  decoder.skip(4); // mnStringLength (uint32; 4 bytes)

  const entries: KeyStringPair[] = [];
  for (let id = 0; id < mnNumEntries; id++) {
    const key = decoder.uint32();
    decoder.skip(1); // mnFlags (uint8; has no use, will never be set)
    const stringLength = decoder.uint16();
    const string = stringLength > 0 ? decoder.charsUtf8(stringLength) : '';
    entries.push({ key, value: string });
  }

  return entries;
}
