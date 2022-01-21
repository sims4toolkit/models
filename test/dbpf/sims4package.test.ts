import fs from "fs";
import path from "path";
import { expect } from "chai";
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
      // TODO:
    });

    it("should be a new object when an entry is added", () => {
      // TODO:
    });

    it("should be a new object when an entry is deleted", () => {
      // TODO:
    });

    it("should be a new object when an entry is mutated", () => {
      // TODO:
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

      it("should have cached contents", () => {
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
      // TODO:
    });

    it("should add the entry to a dbpf with entries", () => {
      // TODO:
    });

    it("should add the key to the key map", () => {
      // TODO:
    });

    it("should uncache the buffer", () => {
      // TODO:
    });

    it("should not uncache other entries", () => {
      // TODO:
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
    // TODO:
  });

  describe("#getIdForKey()", () => {
    // TODO:
  });

  describe("#getIdsForKey()", () => {
    // TODO:
  });

  describe("#has()", () => {
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

  //#endregion Public Methods
});
