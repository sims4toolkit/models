import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import { StringTableResource } from "../../../../dst/models";

//#region Helpers

const cachedBuffers: { [key: string]: Buffer; } = {};

function getBuffer(filename: string): Buffer {
  if (!cachedBuffers[filename]) {
    const filepath = path.resolve(__dirname, `../../../data/stbls/${filename}.stbl`);
    cachedBuffers[filename] = fs.readFileSync(filepath);
  }

  return cachedBuffers[filename];
}

function getStbl(filename: string): StringTableResource {
  return StringTableResource.from(getBuffer(filename));
}

//#endregion Helpers

describe("StringEntry", () => {
  describe("#key", () => {
    it("should uncache the stbl when set", () => {
      const stbl = getStbl("Normal");
      expect(stbl.isCached).to.be.true;
      stbl.get(0).key++;
      expect(stbl.isCached).to.be.false;
    });

    it("should update the key map when set", () => {
      const stbl = StringTableResource.create();
      expect(stbl.getIdForKey(123)).to.be.undefined;
      const entry = stbl.add(123, "hi");
      expect(stbl.getIdForKey(123)).to.equal(0);
      entry.key = 456;
      expect(stbl.getIdForKey(123)).to.be.undefined;
      expect(stbl.getIdForKey(456)).to.equal(0);
    });
  });

  describe("#string", () => {
    it("should return the value of this entry", () => {
      const stbl = StringTableResource.create();
      const entry = stbl.addAndHash("hi");
      expect(entry.value).to.equal("hi");
      expect(entry.string).to.equal("hi");
    });

    it("should set the value of this entry", () => {
      const stbl = StringTableResource.create();
      const entry = stbl.addAndHash("hi");
      expect(entry.value).to.equal("hi");
      entry.string = "bye";
      expect(entry.value).to.equal("bye");
    });

    it("should uncache the stbl when set", () => {
      const stbl = getStbl("Normal");
      expect(stbl.isCached).to.be.true;
      stbl.get(0).string = "new";
      expect(stbl.isCached).to.be.false;
    });
  });

  describe("#value", () => {
    it("should uncache the stbl when set", () => {
      const stbl = getStbl("Normal");
      expect(stbl.isCached).to.be.true;
      stbl.get(0).value = "new";
      expect(stbl.isCached).to.be.false;
    });
  });

  describe("#clone()", () => {
    it("should return an entry that is equal", () => {
      const stbl = StringTableResource.create();
      const entry = stbl.add(123, "hi");
      const clone = entry.clone();
      expect(entry.equals(clone)).to.be.true;
    });

    it("should not mutate the original", () => {
      const stbl = StringTableResource.create();
      const entry = stbl.add(123, "hi");
      const clone = entry.clone();
      clone.key = 456;
      expect(entry.key).to.equal(123);
    });

    it("should not copy the owner", () => {
      const stbl = StringTableResource.create();
      const entry = stbl.add(123, "hi");
      expect(entry.owner).to.equal(stbl);
      const clone = entry.clone();
      expect(clone.owner).to.be.undefined;
    });
  });

  describe("#equals()", () => {
    it("should return true when key and value are the same", () => {
      const stbl = StringTableResource.create();
      const entry = stbl.add(123, "hi");
      const other = stbl.add(123, "hi");
      expect(entry.equals(other)).to.be.true;
    });

    it("should return false when key is different", () => {
      const stbl = StringTableResource.create();
      const entry = stbl.add(123, "hi");
      const other = stbl.add(456, "hi");
      expect(entry.equals(other)).to.be.false;
    });

    it("should return false when value is different", () => {
      const stbl = StringTableResource.create();
      const entry = stbl.add(123, "hi");
      const other = stbl.add(123, "bye");
      expect(entry.equals(other)).to.be.false;
    });

    it("should return false when other is undefined", () => {
      const stbl = StringTableResource.create();
      const entry = stbl.add(123, "hi");
      expect(entry.equals(undefined)).to.be.false;
    });
  });

  describe("#keyEquals()", () => {
    it("should return true when key is the same", () => {
      const stbl = StringTableResource.create();
      const entry = stbl.add(123, "hi");
      expect(entry.keyEquals(123)).to.be.true;
    });

    it("should return false when key is different", () => {
      const stbl = StringTableResource.create();
      const entry = stbl.add(123, "hi");
      expect(entry.keyEquals(456)).to.be.false;
    });
  });

  describe("#onChange()", () => {
    it("should uncache the owning stbl", () => {
      const stbl = getStbl("Normal");
      expect(stbl.isCached).to.be.true;
      stbl.get(0).onChange();
      expect(stbl.isCached).to.be.false;
    });
  });

  describe("#validate()", () => {
    it("should not throw when key and string are valid", () => {
      const stbl = StringTableResource.create();
      const entry = stbl.add(123, "hi");
      expect(() => entry.validate()).to.not.throw();
    });

    it("should throw if key is negative", () => {
      const stbl = StringTableResource.create();
      const entry = stbl.add(-1, "hi");
      expect(() => entry.validate()).to.throw();
    });

    it("should throw if key is NaN", () => {
      const stbl = StringTableResource.create();
      const entry = stbl.add(NaN, "hi");
      expect(() => entry.validate()).to.throw();
    });

    it("should throw if key is > 32 bit", () => {
      const stbl = StringTableResource.create();
      const entry = stbl.add(0x100000000, "hi");
      expect(() => entry.validate()).to.throw();
    });
  });
});
