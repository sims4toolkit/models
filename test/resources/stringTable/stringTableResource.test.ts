import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import { fnv32 } from "@s4tk/hashing";
import { StringTableResource } from "../../../dst/api";
import MockOwner from "../../mocks/mockOwner";

//#region Helpers

const cachedBuffers: { [key: string]: Buffer; } = {};

function getBuffer(filename: string): Buffer {
  if (!cachedBuffers[filename]) {
    const filepath = path.resolve(__dirname, `../../data/stbls/${filename}.stbl`);
    cachedBuffers[filename] = fs.readFileSync(filepath);
  }

  return cachedBuffers[filename];
}

function getStbl(filename: string): StringTableResource {
  return StringTableResource.from(getBuffer(filename));
}

//#endregion Helpers

describe("StringTableResource", () => {
  //#region Properties

  describe("#buffer", () => {
    // TODO:
  });

  describe("#entries", () => {
    it("should return the entries in an array", () => {
      const stbl = getStbl("Normal");
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
      const stbl = getStbl("Normal");
      const entries = stbl.entries;
      expect(stbl.size).to.equal(3);
      entries.splice(0, 1);
      expect(stbl.size).to.equal(3);
      expect(stbl.get(0).key).to.equal(0x7E08629A);
    });

    it("should not uncache the model when mutated", () => {
      const stbl = getStbl("Normal");
      expect(stbl.isCached).to.be.true;
      const entries = stbl.entries;
      entries.splice(0, 1);
      expect(stbl.isCached).to.be.true;
    });

    it("should be the same object when accessed more than once without changes", () => {
      const stbl = getStbl("Normal");
      const entries = stbl.entries;
      expect(stbl.entries).to.equal(entries);
    });

    it("should be a new object when an entry is added", () => {
      const stbl = getStbl("Normal");
      const entries = stbl.entries;
      stbl.add(2468, "ciao");
      expect(stbl.entries).to.not.equal(entries);
    });

    it("should be a new object when an entry is mutated", () => {
      const stbl = getStbl("Normal");
      const entries = stbl.entries;
      entries[0].key = 2468;
      expect(stbl.entries).to.not.equal(entries);
    });

    it("should be a new object when an entry is removed", () => {
      const stbl = getStbl("Normal");
      const entries = stbl.entries;
      stbl.delete(0);
      expect(stbl.entries).to.not.equal(entries);
    });
  });

  describe("#hasChanged", () => {
    // tested as part of other properties/methods
  });

  describe("#isChanged", () => {
    // tested as part of other properties/methods
  });

  describe("#size", () => {
    it("should return 0 when the stbl is empty", () => {
      const stbl = StringTableResource.create();
      expect(stbl.size).to.equal(0);
    });

    it("should return the number of entries in the stbl", () => {
      const stbl = getStbl("Normal");
      expect(stbl.size).to.equal(3);
    });

    it("should increase by 1 after adding an entry", () => {
      const stbl = getStbl("Normal");
      expect(stbl.size).to.equal(3);
      stbl.addAndHash("hello");
      expect(stbl.size).to.equal(4);
    });

    it("should decrease by 1 after deleting an entry", () => {
      const stbl = getStbl("Normal");
      expect(stbl.size).to.equal(3);
      stbl.delete(0);
      expect(stbl.size).to.equal(2);
    });
  });

  //#endregion Properties

  //#region Initialization

  describe("static#create()", () => {
    it("should not be cached", () => {
      const stbl = StringTableResource.create();
      expect(stbl.isCached).to.be.false;
    });

    it("should be empty if nothing is given", () => {
      const stbl = StringTableResource.create();
      expect(stbl.size).to.equal(0);
    });

    it("should create entries from the given ones", () => {
      const stbl = StringTableResource.create([
        { key: 123, value: "hi" },
        { key: 456, value: "bye" }
      ]);

      expect(stbl.size).to.equal(2);
      expect(stbl.get(0).key).to.equal(123);
      expect(stbl.get(0).value).to.equal("hi");
      expect(stbl.get(1).key).to.equal(456);
      expect(stbl.get(1).value).to.equal("bye");
    });

    it("should not mutate the given entries", () => {
      const original = StringTableResource.create();
      const originalEntry = original.add(123, "hi");
      const stbl = StringTableResource.create([ originalEntry ]);

      stbl.get(0).value = "bye";
      expect(originalEntry.value).to.equal("hi");
      expect(stbl.get(0).value).to.equal("bye");
    });
  });

  describe("static#from()", () => {
    context("stbl header and content are valid", () => {
      it("should be cached", () => {
        const stbl = StringTableResource.from(getBuffer("Normal"));
        expect(stbl.hasChanged).to.be.false;
        expect(stbl.isCached).to.be.true;
      });
  
      it("should read empty stbl", () => {
        const stbl = StringTableResource.from(getBuffer("Empty"));
        expect(stbl.size).to.equal(0);
      });
  
      it("should read stbl with entries", () => {
        const stbl = StringTableResource.from(getBuffer("Normal"));
        expect(stbl.size).to.equal(3);
        const [ first, second, third ] = stbl.entries;
        expect(first.key).to.equal(0x7E08629A);
        expect(first.value).to.equal("This is a string.");
        expect(second.key).to.equal(0xF098F4B5);
        expect(second.value).to.equal("This is another string!");
        expect(third.key).to.equal(0x8D6D117D);
        expect(third.value).to.equal("And this, this is a third.");
      });

      it("should read stbl with special characters", () => {
        const stbl = StringTableResource.from(getBuffer("SpecialChars"));
        expect(stbl.size).to.equal(4);
        expect(stbl.get(3).value).to.equal("Thís iš å strįñg w/ spêçiāl chars.");
      });

      it("should load identical entries as their own objects", () => {
        const stbl = StringTableResource.from(getBuffer("RepeatedStrings"));
        expect(stbl.size).to.equal(6);
        const [ first, second, third, fourth, fifth, sixth ] = stbl.entries;

        expect(first).to.not.equal(second);
        expect(first.equals(second)).to.be.true;

        expect(third).to.not.equal(fourth);
        expect(third.key).to.not.equal(fourth.key);
        expect(third.value).to.equal(fourth.value);

        expect(fifth).to.not.equal(sixth);
        expect(fifth.key).to.equal(sixth.key);
        expect(fifth.value).to.not.equal(sixth.value);
      });
    });
    
    context("stbl header is valid, but content is invalid", () => {
      it("should throw if ignoreErrors = false", () => {
        // TODO:
      });

      it("should throw even if ignoreErrors = true", () => {
        // TODO:
      });

      it("should return undefined if dontThrow = true", () => {
        // TODO:
      });
    });

    context("stbl header is invalid, but content is valid", () => {
      it("should throw if ignoreErrors = false", () => {
        // TODO:
      });

      it("should return the table content if ignoreErrors = true", () => {
        // TODO:
      });

      it("should return undefined if dontThrow = true", () => {
        // TODO:
      });
    });
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
    it("should delete all entries", () => {
      const stbl = getStbl("Normal");
      expect(stbl.size).to.equal(3);
      stbl.clear();
      expect(stbl.size).to.equal(0);
    });

    it("should reset the key map", () => {
      const stbl = getStbl("Normal");
      const key = stbl.get(0).key;
      expect(stbl.hasKey(key)).to.be.true;
      stbl.clear();
      expect(stbl.hasKey(key)).to.be.false;
    });

    it("should uncache the buffer", () => {
      const stbl = getStbl("Normal");
      expect(stbl.isCached).to.be.true;
      stbl.clear();
      expect(stbl.isCached).to.be.false;
    });

    it("should reset the entries property", () => {
      const stbl = getStbl("Normal");
      const entries = stbl.entries;
      stbl.clear();
      const newEntries = stbl.entries;
      expect(newEntries).to.not.equal(entries);
      expect(newEntries).to.be.an('Array').that.is.empty;
    });

    it("should reset the ID counter", () => {
      const stbl = getStbl("Normal");
      stbl.clear();
      const entry = stbl.addAndHash("hi");
      expect(stbl.getIdForKey(entry.key)).to.equal(0);
    });
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
    it("should return true if stbls have the same entries", () => {
      const stbl = getStbl("Normal");
      const other = stbl.clone();
      expect(stbl.equals(other)).to.be.true;
    });

    it("should return false if an entry has a different key", () => {
      const stbl = getStbl("Normal");
      const other = stbl.clone();
      other.get(0).key = 123;
      expect(stbl.equals(other)).to.be.false;
    });

    it("should return false if an entry has a different value", () => {
      const stbl = getStbl("Normal");
      const other = stbl.clone();
      other.get(0).value = "hi";
      expect(stbl.equals(other)).to.be.false;
    });
  });

  describe("#findRepeatedKeys()", () => {
    it("should be empty when there are no repeated keys", () => {
      const stbl = getStbl("Normal");
      const keys = stbl.findRepeatedKeys();
      expect(keys).to.be.an('Array').that.is.empty;
    });

    it("should return all keys that are repeated", () => {
      const stbl = getStbl("RepeatedStrings");
      const keys = stbl.findRepeatedKeys();
      expect(keys).to.be.an('Array').with.lengthOf(2);
      expect(keys[0]).to.equal(0xCFE9989D);
      expect(keys[1]).to.equal(0x849FFEE6);
    });
  });

  describe("#get()", () => {
    it("should return the entry with the given ID", () => {
      // TODO:
    });

    it("should return the same item for the same ID even if one before it is removed", () => {
      // TODO:
    });

    it("should return undefined if the given ID doesn't exist", () => {
      // TODO:
    });
  });

  describe("#getByKey()", () => {
    it("should return the entry with the given key", () => {
      // TODO:
    });

    it("should return an entry after adding it", () => {
      // TODO:
    });

    it("should return the correct entry after changing its key", () => {
      // TODO:
    });

    it("should return undefined after removing the entry", () => {
      // TODO:
    });

    it("should return the first entry with the given if there are more than one", () => {
      // TODO:
    });

    it("should return undefined if the given key doesn't exist", () => {
      // TODO:
    });
  });

  describe("#getIdForKey()", () => {
    it("should return the ID for the given key", () => {
      // TODO:
    });

    it("should return the first ID for the given key if there are more than one", () => {
      // TODO:
    });

    it("should return undefined after the entry with the key is deleted", () => {
      // TODO:
    });

    it("should return the ID for an entry after adding it", () => {
      // TODO:
    });
  });

  describe("#getIdsForKey()", () => {
    it("should return an empty array if no entries have this key", () => {
      const stbl = getStbl("Normal");
      const ids = stbl.getIdsForKey(0);
      expect(ids).to.be.an('Array').that.is.empty;
    });

    it("should return the ID for the given key", () => {
      const stbl = getStbl("Normal");
      const entry = stbl.get(1);
      const ids = stbl.getIdsForKey(entry.key);
      expect(ids).to.be.an('Array').with.lengthOf(1);
      expect(ids[0]).to.equal(1);
    });

    it("should return all IDs for the given key", () => {
      const stbl = getStbl("Normal");
      const entry = stbl.get(0);
      stbl.add(entry.key, entry.value);
      const ids = stbl.getIdsForKey(entry.key);
      expect(ids).to.be.an('Array').with.lengthOf(2);
      expect(ids[0]).to.equal(0);
      expect(ids[1]).to.equal(3);
    });
  });

  describe("#hasKey()", () => {
    it("should return true if the key is in the model", () => {
      const stbl = getStbl("Normal");
      expect(stbl.hasKey(0x7E08629A)).to.be.true;
    });

    it("should return true if the key was not in the model but was added", () => {
      const stbl = getStbl("Normal");
      expect(stbl.hasKey(123)).to.be.false;
      stbl.add(123, "hi");
      expect(stbl.hasKey(123)).to.be.true;
    });

    it("should return false if the key is not in the model", () => {
      const stbl = getStbl("Normal");
      expect(stbl.hasKey(123)).to.be.false;
    });

    it("should return false if the key was in the model but was removed", () => {
      const stbl = getStbl("Normal");
      expect(stbl.hasKey(0x7E08629A)).to.be.true;
      stbl.deleteByKey(0x7E08629A);
      expect(stbl.hasKey(0x7E08629A)).to.be.false;
    });
  });

  describe("#resetEntries()", () => {
    it("should force the entries to make a new list", () => {
      const stbl = getStbl("Normal");
      const entries = stbl.entries;
      expect(entries).to.equal(stbl.entries);
      stbl.resetEntries();
      expect(entries).to.not.equal(stbl.entries);
    });
  });

  describe("#uncache()", () => {
    it("should uncache the buffer", () => {
      const stbl = getStbl("Normal");
      expect(stbl.isCached).to.be.true;
      stbl.uncache();
      expect(stbl.isCached).to.be.false;
    });

    it("should notify the owner to uncache", () => {
      const owner = new MockOwner();
      const stbl = getStbl("Normal");
      stbl.owner = owner;
      expect(owner.cached).to.be.true;
      stbl.uncache();
      expect(owner.cached).to.be.false;
    });

    it("should reset the entries", () => {
      const stbl = getStbl("Normal");
      const entries = stbl.entries;
      expect(entries).to.equal(stbl.entries);
      stbl.uncache();
      expect(entries).to.not.equal(stbl.entries);
    });
  });

  describe("#validate()", () => {
    it("should not throw if all entries are valid", () => {
      const stbl = getStbl("Normal");
      expect(() => stbl.validate()).to.not.throw();
    });

    it("should throw if at least one entry is not valid", () => {
      const stbl = getStbl("Normal");
      stbl.get(0).key = -1;
      expect(() => stbl.validate()).to.throw();
    });

    it("should throw if there are multiple strings with the same key", () => {
      const stbl = getStbl("Normal");
      const entry = stbl.get(0);
      stbl.add(entry.key, entry.value);
      expect(() => stbl.validate()).to.throw();
    });
  });

  //#endregion Methods
});

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

  describe("#uncache()", () => {
    it("should uncache the owning stbl", () => {
      const stbl = getStbl("Normal");
      expect(stbl.isCached).to.be.true;
      stbl.get(0).uncache();
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
