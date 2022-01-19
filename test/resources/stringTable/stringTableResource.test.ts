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
    it("should return the entries in an array", () => {
      const stbl = getStbl("Basic");
      expect(stbl.entries).to.be.an('Array').with.lengthOf(3);
      const [ first, second, third ] = stbl.entries;
      expect(first.key).to.equal(0x7E08629A);
      expect(first.value).to.equal("This is a string.");
      expect(second.key).to.equal(0xF098F4B5);
      expect(second.value).to.equal("This is another string!");
      expect(third.key).to.equal(0x8D6D117D);
      expect(third.value).to.equal("And this, this is a third.");
    });

    it("should not mutate the internal map", () => {
      const stbl = getStbl("Basic");
      const entries = stbl.entries;
      expect(stbl.size).to.equal(3);
      entries.splice(0, 1);
      expect(stbl.size).to.equal(3);
      expect(stbl.get(0).key).to.equal(0x7E08629A);
    });

    it("should not uncache the model when mutated", () => {
      const stbl = getStbl("Basic");
      expect(stbl.isCached).to.be.true;
      const entries = stbl.entries;
      entries.splice(0, 1);
      expect(stbl.isCached).to.be.true;
    });

    it("should be the same object when accessed more than once without changes", () => {
      const stbl = getStbl("Basic");
      const entries = stbl.entries;
      expect(stbl.entries).to.equal(entries);
    });

    it("should be a new object when an entry is added", () => {
      const stbl = getStbl("Basic");
      const entries = stbl.entries;
      stbl.add(2468, "ciao");
      expect(stbl.entries).to.not.equal(entries);
    });

    it("should be a new object when an entry is mutated", () => {
      const stbl = getStbl("Basic");
      const entries = stbl.entries;
      entries[0].key = 2468;
      expect(stbl.entries).to.not.equal(entries);
    });

    it("should be a new object when an entry is removed", () => {
      const stbl = getStbl("Basic");
      const entries = stbl.entries;
      stbl.delete(0);
      expect(stbl.entries).to.not.equal(entries);
    });
  });

  describe("#hasChanged", () => {
    // tested as part of other properties/methods
  });

  describe("#header", () => {
    // TODO:
  });

  describe("#isChanged", () => {
    // tested as part of other properties/methods
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
    it("should not have a cached buffer", () => {
      // TODO:
    });
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
