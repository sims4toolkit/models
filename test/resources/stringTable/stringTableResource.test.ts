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
  //#region Properties

  describe("#buffer", () => {
    // TODO:
  });

  describe("#entries", () => {
    // TODO:
  });

  describe("#hasChanged", () => {
    // TODO:
  });

  describe("#header", () => {
    // TODO:
  });
  
  describe("#owner", () => {
    // TODO:
  });

  describe("#size", () => {
    it("should return 0 when the stbl is empty", () => {
      const stbl = StringTableResource.create();
      expect(stbl.size).to.equal(0);
    });

    it("should return the number of entries in the stbl", () => {
      const stbl = getStbl("Basic");
      expect(stbl.size).to.equal(3);
    });

    it("should increase by 1 after adding an entry", () => {
      const stbl = getStbl("Basic");
      expect(stbl.size).to.equal(3);
      stbl.addAndHash("hello");
      expect(stbl.size).to.equal(4);
    });

    it("should decrease by 1 after deleting an entry", () => {
      const stbl = getStbl("Basic");
      expect(stbl.size).to.equal(3);
      stbl.delete(0);
      expect(stbl.size).to.equal(2);
    });
  });

  //#endregion Properties

  //#region Initialization

  describe("static#create()", () => {
    // TODO:
  });

  describe("static#from()", () => {
    // TODO:
  });

  //#endregion Initialization

  //#region Methods

  describe("#add()", () => {
    // TODO:
  });

  describe("#addAll()", () => {
    // TODO:
  });

  describe("#addAndHash()", () => {
    // TODO:
  });

  describe("#clear()", () => {
    // TODO:
  });

  describe("#clone()", () => {
    // TODO:
  });

  describe("#delete()", () => {
    // TODO:
  });

  describe("#deleteByKey()", () => {
    // TODO:
  });

  describe("#equals()", () => {
    // TODO:
  });

  describe("#get()", () => {
    // TODO:
  });

  describe("#getByKey()", () => {
    // TODO:
  });

  describe("#getIdForKey()", () => {
    // TODO:
  });

  describe("#getIdsForKey()", () => {
    // TODO:
  });

  describe("#hasKey()", () => {
    // TODO:
  });

  describe("#resetEntries()", () => {
    // TODO:
  });

  describe("#uncache()", () => {
    // TODO:
  });

  describe("#validate()", () => {
    // TODO:
  });

  //#endregion Methods
});

describe("StringEntry", () => {
  describe("#key", () => {
    // TODO:
  });

  describe("#owner", () => {
    // TODO:
  });

  describe("#value", () => {
    // TODO:
  });

  describe("#clone()", () => {
    // TODO:
  });

  describe("#equals()", () => {
    // TODO:
  });

  describe("#keyEquals()", () => {
    // TODO:
  });

  describe("#uncache()", () => {
    // TODO:
  });

  describe("#validate()", () => {
    // TODO:
  });
});
