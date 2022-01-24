import type { KeyStringPair } from "../shared";
import { BinaryEncoder } from "@s4tk/encoding";

/**
 * Writes STBL content to a buffer.
 * 
 * @param stbl STBL to serialize
 */
export default function writeStbl(entries: KeyStringPair[]): Buffer {
  let totalBytes = 21; // num bytes in header
  let totalStringLength = 0;
  const stringLengths: number[] = [];
  entries.forEach(entry => {
    const stringLength = Buffer.byteLength(entry.value);
    stringLengths.push(stringLength);
    totalStringLength += stringLength + 1;
    totalBytes += stringLength + 7;
  });

  const buffer = Buffer.alloc(totalBytes);
  const encoder = new BinaryEncoder(buffer);

  encoder.charsUtf8('STBL'); // mnFileIdentifier
  encoder.uint16(5); // mnVersion (should be 5)
  encoder.uint8(0); // mnCompressed (should be null)
  encoder.uint64(entries.length); // mnNumEntries
  encoder.uint8(0); // mReserved[0] (should be null)
  encoder.uint8(0); // mReserved[1] (should be null)
  encoder.uint32(totalStringLength); // mnStringLength
  entries.forEach((entry, index) => {
    encoder.uint32(entry.key);
    encoder.skip(1); // mnFlags (should be null)
    encoder.uint16(stringLengths[index]);
    encoder.charsUtf8(entry.value);
  });

  return buffer;
}
