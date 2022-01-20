import { BinaryDecoder } from "@s4tk/encoding";
import type { SerializationOptions } from "../../shared";
import type { ResourceKey, ResourceKeyPair } from "../shared";


/**
 * Reads the given buffer as a DBPF and returns a DTO for it.
 * 
 * @param buffer Buffer to read as a DBPF
 * @param options Options for reading DBPF
 */
export default function readDbpf(buffer: Buffer, {
  ignoreErrors = false,
  dontThrow = false,
  loadRaw = false
}: SerializationOptions = {}): ResourceKeyPair[] {
  const decoder = new BinaryDecoder(buffer);

  if (decoder.charsUtf8(4) !== "DBPF")
    throw new Error("Not a package file.");

  return;
}
