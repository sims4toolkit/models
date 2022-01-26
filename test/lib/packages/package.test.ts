import fs from "fs";
import path from "path";
import { expect } from "chai";
import compare from "just-compare";
import clone from "just-clone";
import type { ResourceKey } from "../../../dst/lib/packages/types";
import { Package, RawResource, SimDataResource, StringTableResource, XmlResource } from "../../../dst/models";
import { EncodingType, TuningResourceType } from "../../../dst/enums";

//#region Helpers

const cachedBuffers: { [key: string]: Buffer; } = {};

function getBuffer(filename: string): Buffer {
  if (!cachedBuffers[filename]) {
    const filepath = path.resolve(__dirname, `../../data/packages/${filename}.package`);
    cachedBuffers[filename] = fs.readFileSync(filepath);
  }

  return cachedBuffers[filename];
}

function getPackage(filename: string): Package {
  return Package.from(getBuffer(filename));
}

function getTestTuning(): XmlResource {
  return XmlResource.create({ content: `<I n="something">\n  <T n="value">50</T>\n</I>` });
}

function getTestKey(): ResourceKey {
  return { type: TuningResourceType.Trait, group: 456, instance: 789n };
}

//#endregion Helpers

// TODO: fix for new cacheing, add tests for saveBuffer, saveCompressedBuffers, and saveDecompressedBuffers

describe("Package", () => {
  //#region Properties

  describe("#buffer", () => {
    it("should serialize a dbpf that is empty", () => {
      const original = Package.create();
      const dbpf = Package.from(original.buffer);
      expect(dbpf.size).to.equal(0);
    });

    it("should serialize a dbpf that wasn't changed, but was uncached", () => {
      const buffer = getBuffer("Trait");
      const original = Package.from(buffer);
      original.onChange();
      expect(original.buffer).to.not.equal(buffer);
      const dbpf = Package.from(original.buffer);
      expect(dbpf.equals(original)).to.be.true;
    });

    it("should serialize a dbpf that had entries added", () => {
      const original = getPackage("Trait");
      expect(original.size).to.equal(2);
      const testKey = getTestKey();
      original.add(testKey, getTestTuning());
      const dbpf = Package.from(original.buffer);
      expect(dbpf.size).to.equal(3);
      expect(dbpf.get(2).keyEquals(testKey)).to.be.true;
      expect(dbpf.get(2).value.equals(getTestTuning())).to.be.true;
    });

    it("should serialize a dbpf that had entries removed", () => {
      const original = getPackage("Trait");
      expect(original.size).to.equal(2);
      original.delete(0);
      const dbpf = Package.from(original.buffer);
      expect(dbpf.size).to.equal(1);
      const tuning = dbpf.get(0).value as XmlResource;
      expect(tuning.encodingType).to.equal(EncodingType.XML);
      expect(tuning.root.name).to.equal("frankkulak_LB:trait_SimlishNative");
    });

    it("should serialize a dbpf that had entries mutated", () => {
      const original = getPackage("Trait");
      expect(original.size).to.equal(2);
      original.delete(0);
      const dbpf = Package.from(original.buffer);
      expect(dbpf.size).to.equal(1);
      const tuning = dbpf.get(0).value as XmlResource;
      expect(tuning.encodingType).to.equal(EncodingType.XML);
      expect(tuning.root.name).to.equal("frankkulak_LB:trait_SimlishNative");
    });
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
      const testKey = getTestKey();
      dbpf.add(testKey, XmlResource.create());
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
      const dbpf = Package.create();
      expect(dbpf.size).to.equal(0);
    });

    it("should create entries from the ones that are given", () => {
      const dbpf = Package.create({ entries: [
        { key: getTestKey(), value: getTestTuning() }
      ]});

      expect(dbpf.size).to.equal(1);
      const entry = dbpf.get(0);
      expect(entry.keyEquals(getTestKey())).to.be.true;
      expect(entry.value.equals(getTestTuning())).to.be.true;
    });

    it("should assign itself as the owner of the given entries", () => {
      const dbpf = Package.create({ entries: [
        { key: getTestKey(), value: getTestTuning() }
      ]});

      const entry = dbpf.get(0);
      expect(entry.owner).to.equal(dbpf);
    });

    it("should not be cached", () => {
      const dbpf = Package.create();
      expect(dbpf.isCached).to.be.false;
    });
  });

  describe("static#from()", () => {
    context("dbpf is valid", () => {
      it("should be cached", () => {
        const dbpf = getPackage("CompleteTrait");
        expect(dbpf.isCached).to.be.true;
      });

      it("should read empty dbpf", () => {
        const dbpf = getPackage("Empty");
        expect(dbpf.size).to.equal(0);
      });

      it("should read dbpf with entries", () => {
        const dbpf = getPackage("CompleteTrait");
        expect(dbpf.size).to.equal(4);
      });

      it("should have cached entries", () => {
        const dbpf = getPackage("CompleteTrait");
        dbpf.entries.forEach(entry => {
          expect(entry.isCached).to.be.true;
        });
      });

      it("should have cached resources within its entries", () => {
        const dbpf = getPackage("CompleteTrait");
        dbpf.entries.forEach(entry => {
          expect(entry.value.isCached).to.be.true;
        });
      });

      it("should read tuning resource correctly", () => {
        const dbpf = getPackage("CompleteTrait");
        const entry = dbpf.get(2);
        const key = entry.key;
        const tuning = entry.value as XmlResource;
        expect(compare(key, {
          type: 0xCB5FDDC7,
          group: 0,
          instance: 0x97297134D57FE219n
        })).to.be.true;
        expect(tuning.root.name).to.equal("frankkulak_LB:trait_SimlishNative");
        expect(tuning.root.children[1].innerValue).to.equal("0x4EB3C46C");
      });

      it("should read stbl resource correctly", () => {
        const dbpf = getPackage("CompleteTrait");
        const entry = dbpf.get(3);
        const key = entry.key;
        const stbl = entry.value as StringTableResource;
        expect(compare(key, {
          type: 0x220557DA,
          group: 0x80000000,
          instance: 0x0020097334286DF8n
        })).to.be.true;
        expect(stbl.size).to.equal(2);
        expect(stbl.get(0).value).to.equal("Simlish Native");
      });

      it("should read simdata resource correctly", () => {
        const dbpf = getPackage("CompleteTrait");
        const entry = dbpf.get(1);
        const key = entry.key;
        const simdata = entry.value as SimDataResource;
        expect(compare(key, {
          type: 0x545AC67A,
          group: 0x005FDD0C,
          instance: 0x97297134D57FE219n
        })).to.be.true;
        expect(simdata.instance.name).to.equal("frankkulak_LB:trait_SimlishNative");
        expect(simdata.props.display_name.asAny.value).to.equal(0x4EB3C46C);
      });

      it("should read raw resource correctly", () => {
        const dbpf = getPackage("CompleteTrait");
        const entry = dbpf.get(0);
        const key = entry.key;
        const image = entry.value as RawResource;
        expect(compare(key, {
          type: 0x00B2D882,
          group: 0,
          instance: 0x0B3417C01CCD98FEn
        })).to.be.true;
        expect(image.encodingType).to.equal(EncodingType.Unknown);
      });

      it("should read other xml resource correctly", () => {
        const dbpf = getPackage("Animation");
        const entry = dbpf.get(0);
        const key = entry.key;
        const animation = entry.value as XmlResource;
        expect(compare(key, {
          type: 0x02D5DF13,
          group: 0,
          instance: 0x2C6BFE4373B9990En
        })).to.be.true;
        expect(animation.encodingType).to.equal(EncodingType.XML);
        expect(animation.root.tag).to.equal("ASM");
        expect(animation.root.children[1].attributes.name).to.equal("utensil");
      });

      it("should load all contents as raw if told to", () => {
        const dbpf = Package.from(getBuffer("CompleteTrait"), {
          loadRaw: true
        });

        dbpf.entries.forEach(entry => {
          expect(entry.value.encodingType).to.equal(EncodingType.Unknown);
        });
      });
    });

    context("dbpf header is invalid", () => {
      it("should throw if ignoreErrors = false", () => {
        expect(() => Package.from(getBuffer("CorruptHeader"), { ignoreErrors: false })).to.throw();
      });

      it("should not throw if ignoreErrors = true", () => {
        expect(() => Package.from(getBuffer("CorruptHeader"), { ignoreErrors: true })).to.not.throw();
      });

      it("should return a regular DBPF if ignoreErrors = true", () => {
        const dbpf = Package.from(getBuffer("CorruptHeader"), { ignoreErrors: true });
        expect(dbpf.size).to.equal(2);
      });
    });

    context("dbpf content is invalid", () => {
      it("should throw if ignoreErrors = false", () => {
        expect(() => Package.from(getBuffer("Corrupt"), { ignoreErrors: false })).to.throw();
      });

      it("should throw even if ignoreErrors = true", () => {
        expect(() => Package.from(getBuffer("Corrupt"), { ignoreErrors: true })).to.throw();
      });
    });
  });

  //#endregion Initialization

  //#region Public Methods

  describe("#add()", () => {
    it("should add the entry to an empty dbpf", () => {
      const dbpf = Package.create();
      expect(dbpf.size).to.equal(0);
      const resource = XmlResource.create();
      const testKey = getTestKey();
      dbpf.add(testKey, resource);
      expect(dbpf.size).to.equal(1);
      expect(compare(dbpf.get(0).key, testKey)).to.be.true;
      expect(dbpf.get(0).value).to.equal(resource);
    });

    it("should add the entry to a dbpf with entries", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.size).to.equal(4);
      const resource = XmlResource.create();
      const testKey = getTestKey();
      dbpf.add(testKey, resource);
      expect(dbpf.size).to.equal(5);
      expect(compare(dbpf.get(4).key, testKey)).to.be.true;
      expect(dbpf.get(4).value).to.equal(resource);
    });

    it("should add the key to the key map", () => {
      const dbpf = Package.create();
      const testKey = getTestKey();
      expect(dbpf.hasKey(testKey)).to.be.false;
      dbpf.add(testKey, XmlResource.create());
      expect(dbpf.hasKey(testKey)).to.be.true;
    });

    it("should uncache the buffer", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.isCached).to.be.true;
      const testKey = getTestKey();
      dbpf.add(testKey, XmlResource.create());
      expect(dbpf.isCached).to.be.false;
    });

    it("should not uncache other entries", () => {
      const dbpf = getPackage("CompleteTrait");

      dbpf.entries.forEach(entry => {
        expect(entry.isCached).to.be.true;
      });

      const testKey = getTestKey();
      dbpf.add(testKey, XmlResource.create());
      
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
      const dbpf = Package.create();

      expect(dbpf.size).to.equal(0);

      dbpf.addAll([
        {
          key: { type: 123, group: 456, instance: 789n },
          value: getTestTuning()
        },
        {
          key: { type: 321, group: 654, instance: 987n },
          value: StringTableResource.create({ entries: [ { key: 1, value: "hi" } ]})
        }
      ]);

      expect(dbpf.size).to.equal(2);
      expect(dbpf.get(0).key.type).to.equal(123);
      expect(dbpf.get(1).key.type).to.equal(321);
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
    it("should copy the entries", () => {
      const dbpf = getPackage("Trait");
      expect(dbpf.size).to.equal(2);
      const clone = dbpf.clone();
      expect(clone.size).to.equal(2);
      const [ simdata, tuning ] = clone.entries;
      expect(simdata.value.encodingType).to.equal(EncodingType.DATA);
      expect(simdata.equals(dbpf.get(0))).to.be.true;
      expect(tuning.value.encodingType).to.equal(EncodingType.XML);
      expect(tuning.equals(dbpf.get(1))).to.be.true;
    });

    it("should not mutate the original", () => {
      const dbpf = getPackage("Trait");
      expect(dbpf.size).to.equal(2);
      const clone = dbpf.clone();
      expect(clone.size).to.equal(2);
      const testKey = getTestKey();
      clone.add(testKey, getTestTuning());
      expect(clone.size).to.equal(3);
      expect(dbpf.size).to.equal(2);
    });

    it("should not mutate the original entries", () => {
      const dbpf = getPackage("Trait");
      const clone = dbpf.clone();
      clone.get(0).value = getTestTuning();
      expect(clone.get(0).value.encodingType).to.equal(EncodingType.XML);
      expect(dbpf.get(0).value.encodingType).to.equal(EncodingType.DATA);
    });

    it("should not mutate the original resources", () => {
      const dbpf = getPackage("Trait");
      const clone = dbpf.clone();
      const cloneTuning = clone.get(1).value as XmlResource;
      cloneTuning.content = "";
      const dbpfTuning = dbpf.get(1).value as XmlResource;
      expect(cloneTuning.content).to.equal("");
      expect(dbpfTuning.content).to.not.equal("");
    });

    it("should set itself as the owner of the new entries", () => {
      const dbpf = getPackage("Trait");
      const clone = dbpf.clone();
      clone.entries.forEach(entry => {
        expect(entry.owner).to.equal(clone);
      });
    });
  });

  describe("#delete()", () => {
    it("should delete the entry with the given ID", () => {
      const dbpf = getPackage("Trait");
      const key = dbpf.get(0).key;
      expect(dbpf.size).to.equal(2);
      expect(dbpf.getByKey(key)).to.not.be.undefined;
      dbpf.delete(0);
      expect(dbpf.size).to.equal(1);
      expect(dbpf.getByKey(key)).to.be.undefined;
    });

    it("should uncache the buffer", () => {
      const dbpf = getPackage("Trait");
      expect(dbpf.isCached).to.be.true;
      dbpf.delete(0);
      expect(dbpf.isCached).to.be.false;
    });

    it("should remove the key from the key map", () => {
      const dbpf = getPackage("Trait");
      const key = dbpf.get(0).key;
      expect(dbpf.hasKey(key)).to.be.true;
      dbpf.delete(0);
      expect(dbpf.hasKey(key)).to.be.false;
    });

    it("should update the ID in the key map if there is another entry with the same key", () => {
      const dbpf = getPackage("Trait");
      const key = dbpf.get(0).key;
      dbpf.get(1).key = key;
      expect(dbpf.hasKey(key)).to.be.true;
      expect(dbpf.getIdForKey(key)).to.equal(0);
      dbpf.delete(0);
      expect(dbpf.hasKey(key)).to.be.true;
      expect(dbpf.getIdForKey(key)).to.equal(1);
    });

    it("should reset the entries array", () => {
      const dbpf = getPackage("Trait");
      const entries = dbpf.entries;
      expect(entries).to.equal(dbpf.entries);
      dbpf.delete(0);
      expect(entries).to.not.equal(dbpf.entries);
    });
  });

  describe("#deleteByKey()", () => {
    it("should delete the entry with the given key", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.size).to.equal(4);
      const key = { type: 0x545AC67A, group: 0x005FDD0C, instance: 0x97297134D57FE219n };
      expect(dbpf.getByKey(key).value.encodingType).to.equal(EncodingType.DATA);
      dbpf.deleteByKey(key);
      expect(dbpf.size).to.equal(3);
      expect(dbpf.getByKey(key)).to.be.undefined;
    });
  });

  describe("#equals()", () => {
    it("should return true if dbpfs have the same entries", () => {
      const dbpf = getPackage("CompleteTrait");
      const other = dbpf.clone();      
      expect(dbpf.equals(other)).to.be.true;
    });

    it("should return false if an entry has a different key", () => {
      const dbpf = getPackage("CompleteTrait");
      const other = dbpf.clone();
      other.get(0).key.group++;
      expect(dbpf.equals(other)).to.be.false;
    });

    it("should return false if an entry has a different value", () => {
      const dbpf = getPackage("CompleteTrait");
      const other = dbpf.clone();
      other.get(2).value = getTestTuning();
      expect(dbpf.equals(other)).to.be.false;
    });

    it("should return false if other is undefined", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.equals(undefined)).to.be.false;
    });
  });

  describe("#findRepeatedKeys()", () => {
    it("should be empty when there are no repeated keys", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.findRepeatedKeys()).to.be.an('Array').that.is.empty;
    });

    it("should return all keys that are repeated", () => {
      const dbpf = getPackage("CompleteTrait");
      const first = dbpf.get(0);
      const third = dbpf.get(2);
      dbpf.add(first.key, first.value);
      dbpf.add(third.key, third.value);
      const repeats = dbpf.findRepeatedKeys();
      expect(repeats).to.be.an('Array').with.lengthOf(2);
      expect(compare(repeats[0], first.key)).to.be.true;
      expect(compare(repeats[1], third.key)).to.be.true;
    });
  });

  describe("#get()", () => {
    it("should return the entry with the given ID", () => {
      const dbpf = getPackage("CompleteTrait");
      const image = dbpf.get(0);
      expect(image.value.encodingType).to.equal(EncodingType.Unknown);
      const simdata = dbpf.get(1);
      expect(simdata.value.encodingType).to.equal(EncodingType.DATA);
      const tuning = dbpf.get(2);
      expect(tuning.value.encodingType).to.equal(EncodingType.XML);
      const stbl = dbpf.get(3);
      expect(stbl.value.encodingType).to.equal(EncodingType.STBL);
    });

    it("should return the same item for the same ID even if one before it is removed", () => {
      const dbpf = getPackage("Trait");
      const tuning = dbpf.get(1);
      dbpf.delete(0);
      expect(tuning).to.equal(dbpf.get(1));
    });

    it("should return undefined if the given ID doesn't exist", () => {
      const dbpf = getPackage("Trait");
      expect(dbpf.get(2)).to.be.undefined;
    });
  });

  describe("#getByKey()", () => {
    it("should return the entry with the given key", () => {
      const dbpf = getPackage("CompleteTrait");
      const entry = dbpf.getByKey({
        type: 0xCB5FDDC7,
        group: 0,
        instance: 0x97297134D57FE219n
      });

      expect(entry.value.encodingType).to.equal(EncodingType.XML);
    });

    it("should return an entry after adding it", () => {
      const dbpf = Package.create();
      const key = {
        type: 0xCB5FDDC7,
        group: 0,
        instance: 0x97297134D57FE219n
      };

      expect(dbpf.getByKey(key)).to.be.undefined;
      dbpf.add(key, getTestTuning());
      expect(dbpf.getByKey(key).value.encodingType).to.equal(EncodingType.XML);
    });

    it("should return the correct entry after changing its key", () => {
      const dbpf = getPackage("CompleteTrait");

      const entry = dbpf.getByKey({
        type: 0x545AC67A,
        group: 0x005FDD0C,
        instance: 0x97297134D57FE219n
      });

      entry.key.group = 0;

      expect(dbpf.getByKey({
        type: 0x545AC67A,
        group: 0x005FDD0C,
        instance: 0x97297134D57FE219n
      })).to.be.undefined;

      expect(dbpf.getByKey({
        type: 0x545AC67A,
        group: 0,
        instance: 0x97297134D57FE219n
      })).to.equal(entry);
    });

    it("should return undefined after removing the entry", () => {
      const dbpf = getPackage("CompleteTrait");

      const key = {
        type: 0x545AC67A,
        group: 0x005FDD0C,
        instance: 0x97297134D57FE219n
      };

      expect(dbpf.getByKey(key).value.encodingType).to.equal(EncodingType.DATA);
      dbpf.deleteByKey(key);
      expect(dbpf.getByKey(key)).to.be.undefined;
    });

    it("should return the first entry with the given key if there are more than one", () => {
      const key = getTestKey();

      const dbpf = Package.create({ entries: [
        { key, value: XmlResource.create({ content: "a" }) },
        { key, value: XmlResource.create({ content: "b" }) },
      ]});

      expect((dbpf.getByKey(key).value as XmlResource).content).to.equal("a");
    });

    it("should return undefined if the given key doesn't exist", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.getByKey({
        type: 0,
        group: 0,
        instance: 0n
      })).to.be.undefined;
    });

    it("should return the correct entry if there are more than one entry with this key, and the first was deleted", () => {
      const key = getTestKey();

      const dbpf = Package.create({ entries: [
        { key, value: XmlResource.create({ content: "a" }) },
        { key, value: XmlResource.create({ content: "b" }) },
      ]});

      dbpf.delete(0);
      expect((dbpf.getByKey(key).value as XmlResource).content).to.equal("b");
    });
  });

  describe("#getIdForKey()", () => {
    it("should return the ID for the given key", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.getIdForKey({
        type: 0xCB5FDDC7,
        group: 0,
        instance: 0x97297134D57FE219n
      })).to.equal(2);
    });

    it("should return the first ID for the given key if there are more than one", () => {
      const key = getTestKey();

      const dbpf = Package.create({ entries: [
        { key, value: XmlResource.create({ content: "a" }) },
        { key, value: XmlResource.create({ content: "b" }) },
      ]});

      expect(dbpf.getIdForKey(key)).to.equal(0);
    });

    it("should return undefined after the entry with the key is deleted", () => {
      const dbpf = getPackage("CompleteTrait");

      expect(dbpf.getIdForKey({
        type: 0xCB5FDDC7,
        group: 0,
        instance: 0x97297134D57FE219n
      })).to.not.be.undefined;

      dbpf.delete(2);

      expect(dbpf.getIdForKey({
        type: 0xCB5FDDC7,
        group: 0,
        instance: 0x97297134D57FE219n
      })).to.be.undefined;
    });

    it("should return the ID for an entry after adding it", () => {
      const dbpf = Package.create();
      const key = {
        type: 0xCB5FDDC7,
        group: 0,
        instance: 0x97297134D57FE219n
      };

      expect(dbpf.getIdForKey(key)).to.be.undefined;
      dbpf.add(key, getTestTuning());
      expect(dbpf.getIdForKey(key)).to.equal(0);
    });
  });

  describe("#getIdsForKey()", () => {
    it("should return an empty array if no entries have this key", () => {
      const dbpf = getPackage("Trait");
      expect(dbpf.getIdsForKey(getTestKey())).to.be.an('Array').that.is.empty;
    });

    it("should return the ID for the given key", () => {
      const dbpf = getPackage("Trait");
      const ids = dbpf.getIdsForKey(dbpf.get(1).key);
      expect(ids).to.be.an('Array').with.lengthOf(1);
      expect(ids[0]).to.equal(1);
    });

    it("should return all IDs for the given key", () => {
      const dbpf = getPackage("Trait");
      dbpf.addAll(dbpf.entries);
      const ids = dbpf.getIdsForKey(dbpf.get(0).key);
      expect(ids).to.be.an('Array').with.lengthOf(2);
      expect(ids[0]).to.equal(0);
      expect(ids[1]).to.equal(2);
    });
  });

  describe("#has()", () => {
    it("should return true if the ID is in the model", () => {
      const dbpf = getPackage("Trait");
      expect(dbpf.has(0)).to.be.true;
    });

    it("should return true if the ID was not in the model but was added", () => {
      const dbpf = getPackage("Trait");
      expect(dbpf.has(2)).to.be.false;
      dbpf.add(getTestKey(), getTestTuning());
      expect(dbpf.has(2)).to.be.true;
    });

    it("should return false if the ID is not in the model", () => {
      const dbpf = getPackage("Trait");
      expect(dbpf.has(2)).to.be.false;
    });

    it("should return false if the ID was in the model but was removed", () => {
      const dbpf = getPackage("Trait");
      expect(dbpf.has(1)).to.be.true;
      dbpf.delete(1);
      expect(dbpf.has(1)).to.be.false;
    });
  });

  describe("#hasKey()", () => {
    it("should return true if the key is in the model", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.hasKey(dbpf.get(0).key)).to.be.true;
    });

    it("should return true if a different instance, but identical, key is in the model", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.hasKey(clone(dbpf.get(0).key))).to.be.true;
    });

    it("should return true if the key was not in the model but was added", () => {
      const dbpf = getPackage("CompleteTrait");
      const key = getTestKey();
      expect(dbpf.hasKey(key)).to.be.false;
      dbpf.add(key, getTestTuning());
      expect(dbpf.hasKey(key)).to.be.true;
    });

    it("should return false if the key is not in the model", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.hasKey(getTestKey())).to.be.false;
    });

    it("should return false if the key was in the model but was removed", () => {
      const dbpf = getPackage("CompleteTrait");
      const key = dbpf.get(0).key;
      expect(dbpf.hasKey(key)).to.be.true;
      dbpf.delete(0);
      expect(dbpf.hasKey(key)).to.be.false;
    });

    it("should return true if there are more than one entry with this key, and the first was deleted", () => {
      const key = getTestKey();

      const dbpf = Package.create({ entries: [
        { key, value: XmlResource.create({ content: "a" }) },
        { key, value: XmlResource.create({ content: "b" }) },
      ]});

      expect(dbpf.hasKey(key)).to.be.true;
      dbpf.deleteByKey(key);
      expect(dbpf.hasKey(key)).to.be.true;
    });
  });

  describe("#resetEntries()", () => {
    it("should force the entries to make a new list", () => {
      const dbpf = getPackage("Trait");
      const entries = dbpf.entries;
      expect(entries).to.equal(dbpf.entries);
      dbpf.resetEntries();
      expect(entries).to.not.equal(dbpf.entries);
    });
  });

  describe("#onChange()", () => {
    it("should uncache the buffer", () => {
      const dbpf = getPackage("Trait");
      expect(dbpf.isCached).to.be.true;
      dbpf.onChange();
      expect(dbpf.isCached).to.be.false;
    });

    it("should reset the entries", () => {
      const dbpf = getPackage("Trait");
      const entries = dbpf.entries;
      expect(entries).to.equal(dbpf.entries);
      dbpf.onChange();
      expect(entries).to.not.equal(dbpf.entries);
    });

    it("should not uncache the entries", () => {
      const dbpf = getPackage("Trait");
      dbpf.onChange();
      dbpf.entries.forEach(entry => {
        expect(entry.isCached).to.be.true;
      });
    });

    it("should not uncache the entries' resources", () => {
      const dbpf = getPackage("Trait");
      dbpf.onChange();
      dbpf.entries.forEach(entry => {
        expect(entry.value.isCached).to.be.true;
      });
    });
  });

  describe("#validate()", () => {
    it("should not throw if all entries are valid", () => {
      const dbpf = Package.create({ entries: [
        {
          key: {
            type: 123,
            group: 456,
            instance: 789n
          },
          value: getTestTuning()
        },
        {
          key: {
            type: 321,
            group: 654,
            instance: 987n
          },
          value: StringTableResource.create({ entries: [
            { key: 1, value: "hi" }
          ]})
        }
      ]});

      expect(() => dbpf.validate()).to.not.throw();
    });

    it("should throw if at least one entry is not valid", () => {
      const dbpf = Package.create({ entries: [
        {
          key: {
            type: -1,
            group: 456,
            instance: 789n
          },
          value: getTestTuning()
        },
        {
          key: {
            type: 321,
            group: 654,
            instance: 987n
          },
          value: StringTableResource.create({ entries: [
            { key: 1, value: "hi" }
          ]})
        }
      ]});

      expect(() => dbpf.validate()).to.throw();
    });

    it("should throw if there are multiple entries with the same key", () => {
      const dbpf = Package.create({ entries: [
        {
          key: {
            type: 123,
            group: 456,
            instance: 789n
          },
          value: getTestTuning()
        },
        {
          key: {
            type: 123,
            group: 456,
            instance: 789n
          },
          value: StringTableResource.create({ entries: [
            { key: 1, value: "hi" }
          ]})
        }
      ]});

      expect(() => dbpf.validate()).to.throw();
    });
  });

  //#endregion Public Methods
});
