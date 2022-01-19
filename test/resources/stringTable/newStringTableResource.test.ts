import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import { fnv32 } from "@s4tk/hashing";
import { StringTableResource } from "../../../dst/api";

//#region Helpers

const cachedBuffers: { [key: string]: Buffer; } = {};

function getStbl(filename: string): StringTableResource {
  if (!cachedBuffers[filename]) {
    const filepath = path.resolve(__dirname, `../../data/stbls/${filename}.stbl`);
    cachedBuffers[filename] = fs.readFileSync(filepath);
  }

  return StringTableResource.from(cachedBuffers[filename]);
}

//#endregion Helpers

describe("StringTableResource", () => {
  // TODO:
});
