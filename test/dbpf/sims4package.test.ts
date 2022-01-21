import fs from "fs";
import path from "path";
import { expect } from "chai";
import compare from "just-compare";
import type { ResourceKey } from "../../dst/lib/dbpf/shared";
import { Sims4Package, TuningResource } from "../../dst/api";

//#region Constants

const testKey: ResourceKey = { type: 123, group: 456, instance: 789n };

//#endregion Constants

//#region Helpers

const cachedBuffers: { [key: string]: Buffer; } = {};

function getBuffer(filename: string): Buffer {
  if (!cachedBuffers[filename]) {
    const filepath = path.resolve(__dirname, `../data/packages/${filename}.package`);
    cachedBuffers[filename] = fs.readFileSync(filepath);
  }

  return cachedBuffers[filename];
}

function getPackage(filename: string): Sims4Package {
  return Sims4Package.from(getBuffer(filename));
}

//#endregion Helpers

describe("Sims4Package", () => {
  //#region Properties

  describe("#buffer", () => {
    // TODO:
  });

  describe("#entries", () => {
    it("should return entries in an array", () => {
      const dbpf = getPackage("CompleteTrait");
      const entries = dbpf.entries;
      expect(entries).to.be.an('Array').with.lengthOf(4);
    });

    it("should not mutate the internal map", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.size).to.equal(4);
      dbpf.entries.push(dbpf.get(0));
      expect(dbpf.size).to.equal(4);
    });

    it("should not uncache the model when mutated", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.isCached).to.be.true;
      dbpf.entries.push(dbpf.get(0));
      expect(dbpf.isCached).to.be.true;
    });

    it("should be the same object when accessed more than once without changes", () => {
      const dbpf = getPackage("CompleteTrait");
      const entries = dbpf.entries;
      expect(entries).to.equal(dbpf.entries);
    });

    it("should be a new object when an entry is added", () => {
      const dbpf = getPackage("CompleteTrait");
      const entries = dbpf.entries;
      const entry = dbpf.get(0);
      dbpf.add(entry.key, entry.value);
      expect(entries).to.not.equal(dbpf.entries);
    });

    it("should be a new object when an entry is deleted", () => {
      const dbpf = getPackage("CompleteTrait");
      const entries = dbpf.entries;
      dbpf.delete(0);
      expect(entries).to.not.equal(dbpf.entries);
    });

    it("should be a new object when an entry is mutated", () => {
      const dbpf = getPackage("CompleteTrait");
      const entries = dbpf.entries;
      dbpf.get(0).key.group++;
      expect(entries).to.not.equal(dbpf.entries);
    });
  });

  // #hasChanged tested by other tests

  // #isCached tested by other tests

  describe("#size", () => {
    it("should return 0 when the dbpf is empty", () => {
      const dbpf = getPackage("Empty");
      expect(dbpf.size).to.equal(0);
    });

    it("should return the number of entries in the dbpf", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.size).to.equal(4);
    });

    it("should increase by 1 after adding an entry", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.size).to.equal(4);
      dbpf.add(testKey, TuningResource.create());
      expect(dbpf.size).to.equal(5);
    });

    it("should decrease by 1 after deleting an entry", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.size).to.equal(4);
      dbpf.delete(0);
      expect(dbpf.size).to.equal(3);
    });
  });

  //#endregion Properties

  //#region Initialization

  describe("static#create()", () => {
    it("should create an empty dbpf if given list is empty", () => {
      // TODO:
    });

    it("should create entries from the ones that are given", () => {
      // TODO:
    });

    it("should assign itself as the owner of the given entries", () => {
      // TODO:
    });

    it("should not be cached", () => {
      // TODO:
    });
  });

  describe("static#from()", () => {
    context("dbpf is valid", () => {
      it("should be cached", () => {
        // TODO:
      });

      it("should read empty dbpf", () => {
        // TODO:
      });

      it("should read dbpf with entries", () => {
        // TODO:
      });

      it("should have cached entries", () => {
        // TODO:
      });

      it("should have cached resources within its entries", () => {
        // TODO:
      });

      it("should read tuning resource correctly", () => {
        // TODO:
      });

      it("should read stbl resource correctly", () => {
        // TODO:
      });

      it("should read simdata resource correctly", () => {
        // TODO:
      });

      it("should read raw resource correctly", () => {
        // TODO:
      });

      it("should read other xml resource correctly", () => {
        // TODO:
      });

      it("should load all contents as raw if told to", () => {
        // TODO:
      });
    });

    context("dbpf header is invalid", () => {
      it("should throw if ignoreErrors = false", () => {
        // TODO:
      });

      it("should not throw if ignoreErrors = true", () => {
        // TODO:
      });

      it("should return return a regular DBPF", () => {
        // TODO:
      });
    });

    context("dbpf content is invalid", () => {
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

    context("inner resource content is invalid", () => {
      it("should throw if ignoreErrors = false", () => {
        // TODO:
      });

      it("should throw even if ignoreErrors = true", () => {
        // TODO:
      });

      it("should contain an undefined resource if dontThrow = true", () => {
        // TODO:
      });

      it("should return a regular DBPF if loading as raw", () => {
        // TODO:
      });
    });
  });

  //#endregion Initialization

  //#region Public Methods

  describe("#add()", () => {
    it("should add the entry to an empty dbpf", () => {
      const dbpf = Sims4Package.create();
      expect(dbpf.size).to.equal(0);
      const resource = TuningResource.create();
      dbpf.add(testKey, resource);
      expect(dbpf.size).to.equal(1);
      expect(compare(dbpf.get(0).key, testKey)).to.be.true;
      expect(dbpf.get(0).value).to.equal(resource);
    });

    it("should add the entry to a dbpf with entries", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.size).to.equal(4);
      const resource = TuningResource.create();
      dbpf.add(testKey, resource);
      expect(dbpf.size).to.equal(5);
      expect(compare(dbpf.get(4).key, testKey)).to.be.true;
      expect(dbpf.get(4).value).to.equal(resource);
    });

    it("should add the key to the key map", () => {
      const dbpf = Sims4Package.create();
      expect(dbpf.hasKey(testKey)).to.be.false;
      dbpf.add(testKey, TuningResource.create());
      expect(dbpf.hasKey(testKey)).to.be.true;
    });

    it("should uncache the buffer", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.isCached).to.be.true;
      dbpf.add(testKey, TuningResource.create());
      expect(dbpf.isCached).to.be.false;
    });

    it("should not uncache other entries", () => {
      const dbpf = getPackage("CompleteTrait");

      dbpf.entries.forEach(entry => {
        expect(entry.isCached).to.be.true;
      });

      dbpf.add(testKey, TuningResource.create());
      
      dbpf.entries.forEach(entry => {
        if (entry.keyEquals(testKey)) {
          expect(entry.isCached).to.be.false;
        } else {
          expect(entry.isCached).to.be.true;
        }
      });
    });
  });

  describe("#addAll()", () => {
    it("should add the given entries", () => {
      // TODO:
    });
  });

  describe("#clear()", () => {
    it("should delete all entries", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.size).to.equal(4);
      dbpf.clear();
      expect(dbpf.size).to.equal(0);
    });

    it("should reset the key map", () => {
      const dbpf = getPackage("CompleteTrait");
      const key = dbpf.get(0).key;
      expect(dbpf.hasKey(key)).to.be.true;
      dbpf.clear();
      expect(dbpf.hasKey(key)).to.be.false;
    });

    it("should uncache the buffer", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.isCached).to.be.true;
      dbpf.clear();
      expect(dbpf.isCached).to.be.false;
    });

    it("should reset the entries property", () => {
      const dbpf = getPackage("CompleteTrait");
      const entries = dbpf.entries;
      dbpf.clear();
      const newEntries = dbpf.entries;
      expect(newEntries).to.not.equal(entries);
      expect(newEntries).to.be.an('Array').that.is.empty;
    });

    it("should reset the ID counter", () => {
      const dbpf = getPackage("CompleteTrait");
      const entry = dbpf.get(3);
      dbpf.clear();
      dbpf.add(entry.key, entry.value);
      expect(dbpf.getIdForKey(entry.key)).to.equal(0);
    });
  });

  describe("#clone()", () => {
    // TODO:
  });

  describe("#equals()", () => {
    // TODO:
  });

  describe("#delete()", () => {
    // TODO:
  });

  describe("#deleteByKey()", () => {
    // TODO:
  });

  describe("#findRepeatedKeys()", () => {
    // TODO:
  });

  describe("#get()", () => {
    // TODO:
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

    it("should return the first entry with the given key if there are more than one", () => {
      // TODO:
    });

    it("should return undefined if the given key doesn't exist", () => {
      // TODO:
    });

    it("should return the correct entry if there are more than one entry with this key, and the first was deleted", () => {
      // TODO:
    });
  });

  describe("#getIdForKey()", () => {
    it("should return the ID for the given key", () => {
      // TODO:
    });

    it("should return the ID for the given key, even if it's another instance", () => {
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
      // TODO:
    });

    it("should return the ID for the given key", () => {
      // TODO:
    });

    it("should return the ID for the given key, even if it's another instance", () => {
      // TODO:
    });

    it("should return all IDs for the given key", () => {
      // TODO:
    });
  });

  describe("#has()", () => {
    it("should return true if the ID is in the model", () => {
      // TODO:
    });

    it("should return true if the ID was not in the model but was added", () => {
      // TODO:
    });

    it("should return false if the ID is not in the model", () => {
      // TODO:
    });

    it("should return false if the ID was in the model but was removed", () => {
      // TODO:
    });
  });

  describe("#hasKey()", () => {
    it("should return true if the key is in the model", () => {
      // TODO:
    });

    it("should return true if a different instance, but identical, key is in the model", () => {
      // TODO:
    });

    it("should return true if the key was not in the model but was added", () => {
      // TODO:
    });

    it("should return false if the key is not in the model", () => {
      // TODO:
    });

    it("should return false if the key was in the model but was removed", () => {
      // TODO:
    });

    it("should return true if there are more than one entry with this key, and the first was deleted", () => {
      // TODO:
    });
  });

  describe("#resetEntries()", () => {
    it("should force the entries to make a new list", () => {
      // TODO:
    });
  });

  describe("#uncache()", () => {
    it("should uncache the buffer", () => {
      // TODO:
    });

    it("should notify the owner to uncache", () => {
      // TODO:
    });

    it("should reset the entries", () => {
      // TODO:
    });

    it("should not uncache the entries", () => {
      // TODO:
    });

    it("should not uncache the entries' resources", () => {
      // TODO:
    });
  });

  describe("#validate()", () => {
    // TODO:
  });

  //#endregion Public Methods
});
