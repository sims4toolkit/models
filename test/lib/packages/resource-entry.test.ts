import fs from "fs";
import path from "path";
import { unzipSync } from "zlib";
import { expect } from "chai";
import type { ResourceKey } from "../../../dst/lib/packages/types";
import { Package, StringTableResource, XmlResource } from "../../../dst/models";
import { EncodingType, TuningResourceType } from "../../../dst/enums";
import { FileReadingOptions } from "../../../dst/lib/common/options";

//#region Helpers

const cachedBuffers: { [key: string]: Buffer; } = {};

function getBuffer(filename: string): Buffer {
  if (!cachedBuffers[filename]) {
    const filepath = path.resolve(__dirname, `../../data/packages/${filename}.package`);
    cachedBuffers[filename] = fs.readFileSync(filepath);
  }

  return cachedBuffers[filename];
}

function getPackage(filename: string, options?: FileReadingOptions): Package {
  return Package.from(getBuffer(filename), options);
}

function getTestTuning(): XmlResource {
  return XmlResource.create({ content: `<I n="something">\n  <T n="value">50</T>\n</I>` });
}

function getTestKey(): ResourceKey {
  return { type: TuningResourceType.Trait, group: 456, instance: 789n };
}

//#endregion Helpers

describe("ResourceEntry", () => {
  //#region Properties

  describe("#buffer", () => {
    it("should serialize and compress the contained resource", () => {
      const tuning = getTestTuning();
      const dbpf = Package.create();
      const testKey = getTestKey();
      const entry = dbpf.add(testKey, tuning);
      const unzipped = unzipSync(entry.buffer).toString();
      expect(unzipped).to.equal(tuning.content);
    });

    it("should return the cached buffer if nothing was changed and saveCompressedBuffers = true", () => {
      const tuning = getTestTuning();
      const dbpf = Package.create({ saveCompressedBuffers: true });
      const testKey = getTestKey();
      const entry = dbpf.add(testKey, tuning);
      const buffer = entry.buffer;
      expect(buffer).to.equal(entry.buffer);
    });

    it("should return a new buffer if nothing was changed and saveCompressedBuffers = false", () => {
      const tuning = getTestTuning();
      const dbpf = Package.create({ saveCompressedBuffers: false });
      const testKey = getTestKey();
      const entry = dbpf.add(testKey, tuning);
      const buffer = entry.buffer;
      expect(buffer).to.not.equal(entry.buffer);
    });

    it("should return a new buffer if it was changed and saveCompressedBuffers = true", () => {
      const tuning = getTestTuning();
      const dbpf = Package.create({ saveCompressedBuffers: true });
      const testKey = getTestKey();
      const entry = dbpf.add(testKey, tuning);
      const buffer = entry.buffer;
      (entry.value as XmlResource).content = "";
      expect(buffer).to.not.equal(entry.buffer);
    });
  });

  describe("#key", () => {
    it("should not uncache the entry when mutated", () => {
      const dbpf = getPackage("Trait", { saveCompressedBuffer: true });
      const entry = dbpf.get(0);
      expect(entry.isCached).to.be.true;
      entry.key.group = 0x80000000;
      expect(entry.isCached).to.be.true;
    });

    it("should not uncache the entry's resource when mutated", () => {
      const dbpf = Package.from(getBuffer("Trait"), {
        saveBuffer: true,
        saveCompressedBuffer: true
      });

      const entry = dbpf.get(0);
      expect(entry.value.isCached).to.be.true;
      entry.key.group = 0x80000000;
      expect(entry.value.isCached).to.be.true;
    });
  });

  // #isCached tested by other tests

  describe("#resource", () => {
    it("should return the value of this entry", () => {
      const dbpf = Package.create();
      const tuning = getTestTuning();
      const entry = dbpf.add(getTestKey(), tuning);
      expect(entry.value).to.equal(tuning);
      expect(entry.resource).to.equal(tuning);
    });

    it("should set the value of this entry", () => {
      const dbpf = Package.create();
      const tuning = getTestTuning();
      const entry = dbpf.add(getTestKey(), tuning);
      expect(entry.value).to.equal(tuning);
      const newTuning = getTestTuning();
      entry.resource = newTuning;
      expect(entry.value).to.not.equal(tuning);
      expect(entry.value).to.equal(newTuning);
    });

    it("should uncache the entry when set", () => {
      const dbpf = getPackage("Trait", { saveCompressedBuffer: true });
      const entry = dbpf.get(0);
      expect(entry.isCached).to.be.true;
      entry.resource = getTestTuning();
      expect(entry.isCached).to.be.false;
    });
  });

  describe("#saveBuffer", () => {
    // TODO:
  });

  describe("#value", () => {
    it("should uncache the entry when mutated", () => {
      const dbpf = getPackage("Trait", { saveCompressedBuffer: true });
      const entry = dbpf.get(1);
      expect(entry.isCached).to.be.true;
      (entry.value as XmlResource).content = "";
      expect(entry.isCached).to.be.false;
    });

    it("should uncache the entry's resource when mutated", () => {
      const dbpf = Package.from(getBuffer("Trait"), {
        saveBuffer: true,
        saveCompressedBuffer: true
      });

      const entry = dbpf.get(1);
      expect(entry.value.isCached).to.be.true;
      (entry.value as XmlResource).content = "";
      expect(entry.value.isCached).to.be.false;
    });
  });

  //#endregion Properties

  //#region Public Methods

  describe("#clone()", () => {
    it("should return an entry that is equal", () => {
      const dbpf = getPackage("Trait");
      const entry = dbpf.get(0);
      const clone = entry.clone();
      expect(clone.value.encodingType).to.equal(EncodingType.DATA);
      expect(clone.equals(dbpf.get(0))).to.be.true;
    });

    it("should not mutate the original key", () => {
      const dbpf = getPackage("Trait");
      const tuningEntry = dbpf.get(1);
      const cloneEntry = tuningEntry.clone();
      cloneEntry.key.group = 0x80000000;
      expect(tuningEntry.key.group).to.equal(0);
      expect(cloneEntry.key.group).to.equal(0x80000000);
    });

    it("should not mutate the original resource", () => {
      const dbpf = getPackage("Trait");
      const tuningEntry = dbpf.get(1);
      const cloneEntry = tuningEntry.clone();
      (cloneEntry.value as XmlResource).content = "";
      expect((cloneEntry.value as XmlResource).content).to.equal("");
      expect((tuningEntry.value as XmlResource).content).to.not.equal("");
    });

    it("should not copy the owner", () => {
      const dbpf = getPackage("Trait");
      const simdataEntry = dbpf.get(0);
      const clone = simdataEntry.clone();
      expect(simdataEntry.owner).to.equal(dbpf);
      expect(clone.owner).to.be.undefined;
    });
  });

  describe("#equals()", () => {
    it("should return true when key and value are equal", () => {
      const dbpf = Package.create();
      const first = dbpf.add(getTestKey(), getTestTuning());
      const second = dbpf.add(getTestKey(), getTestTuning());
      expect(first.equals(second)).to.be.true;
    });

    it("should return false when key is different", () => {
      const dbpf = Package.create();
      const first = dbpf.add(getTestKey(), getTestTuning());
      const secondKey = getTestKey();
      secondKey.group++;
      const second = dbpf.add(secondKey, getTestTuning());
      expect(first.equals(second)).to.be.false;
    });

    it("should return false when value is different", () => {
      const dbpf = Package.create();
      const first = dbpf.add(getTestKey(), getTestTuning());
      const second = dbpf.add(getTestKey(), XmlResource.create());
      expect(first.equals(second)).to.be.false;
    });

    it("should return false when other is undefined", () => {
      const dbpf = Package.create();
      const entry = dbpf.add(getTestKey(), getTestTuning());
      expect(entry.equals(undefined)).to.be.false;
    });
  });

  describe("#keyEquals()", () => {
    it("should return true when key is the same object", () => {
      const dbpf = Package.create();

      const key = {
        type: 123,
        group: 456,
        instance: 789n
      };

      const entry = dbpf.add(key, XmlResource.create());
      expect(entry.keyEquals(key)).to.be.true;
    });

    it("should return true when key is a different object, but identical", () => {
      const dbpf = Package.create();

      const entry = dbpf.add({
        type: 123,
        group: 456,
        instance: 789n
      }, XmlResource.create());

      expect(entry.keyEquals({
        type: 123,
        group: 456,
        instance: 789n
      })).to.be.true;
    });

    it("should return false when keys have different type", () => {
      const dbpf = Package.create();

      const entry = dbpf.add({
        type: 123,
        group: 456,
        instance: 789n
      }, XmlResource.create());

      expect(entry.keyEquals({
        type: 0,
        group: 456,
        instance: 789n
      })).to.be.false;
    });

    it("should return false when keys have different group", () => {
      const dbpf = Package.create();

      const entry = dbpf.add({
        type: 123,
        group: 456,
        instance: 789n
      }, XmlResource.create());

      expect(entry.keyEquals({
        type: 123,
        group: 0,
        instance: 789n
      })).to.be.false;
    });

    it("should return false when keys have different instance", () => {
      const dbpf = Package.create();

      const entry = dbpf.add({
        type: 123,
        group: 456,
        instance: 789n
      }, XmlResource.create());

      expect(entry.keyEquals({
        type: 123,
        group: 456,
        instance: 0n
      })).to.be.false;
    });
  });

  describe("#onChange()", () => {
    it("should reset the compressed buffer", () => {
      const dbpf = Package.from(getBuffer("Trait"), {
        saveBuffer: true,
        saveCompressedBuffer: true
      });

      const entry = dbpf.get(0);
      const buffer = entry.buffer;
      expect(entry.buffer).to.equal(buffer);
      entry.onChange();
      expect(entry.buffer).to.not.equal(buffer);
    });

    it("should not uncache other entries in the dbpf", () => {
      const dbpf = Package.from(getBuffer("Trait"), {
        saveBuffer: true,
        saveCompressedBuffer: true
      });

      const [ simdata, tuning ] = dbpf.entries;
      expect(tuning.isCached).to.be.true;
      expect(tuning.isCached).to.be.true;
      simdata.onChange();
      expect(simdata.isCached).to.be.false;
      expect(tuning.isCached).to.be.true;
    });

    it("should not uncache the contained resource", () => {
      const dbpf = Package.from(getBuffer("Trait"), {
        saveBuffer: true,
        saveCompressedBuffer: true
      });

      const [ simdata ] = dbpf.entries;
      expect(simdata.value.isCached).to.be.true;
      simdata.onChange();
      expect(simdata.value.isCached).to.be.true;
    });
  });

  describe("#validate()", () => {
    it("should not throw when key and resource are valid", () => {
      const dbpf = Package.create();

      const entry = dbpf.add({
        type: 0,
        group: 0,
        instance: 0n
      }, StringTableResource.create({ entries: [
        { key: 1, value: "hi" }
      ]}));

      expect(() => entry.validate()).to.not.throw();
    });

    it("should throw if key type is negative", () => {
      const dbpf = Package.create();

      const entry = dbpf.add({
        type: -1,
        group: 0,
        instance: 0n
      }, StringTableResource.create({ entries: [
        { key: 1, value: "hi" }
      ]}));

      expect(() => entry.validate()).to.throw();
    });

    it("should throw if key group is negative", () => {
      const dbpf = Package.create();

      const entry = dbpf.add({
        type: 0,
        group: -1,
        instance: 0n
      }, StringTableResource.create({ entries: [
        { key: 1, value: "hi" }
      ]}));

      expect(() => entry.validate()).to.throw();
    });

    it("should throw if key instance is negative", () => {
      const dbpf = Package.create();

      const entry = dbpf.add({
        type: 0,
        group: 0,
        instance: -1n
      }, StringTableResource.create({ entries: [
        { key: 1, value: "hi" }
      ]}));

      expect(() => entry.validate()).to.throw();
    });

    it("should throw if key type is > 32 bit", () => {
      const dbpf = Package.create();

      const entry = dbpf.add({
        type: 0x800000000,
        group: 0,
        instance: 0n
      }, StringTableResource.create({ entries: [
        { key: 1, value: "hi" }
      ]}));

      expect(() => entry.validate()).to.throw();
    });

    it("should throw if key group is > 32 bit", () => {
      const dbpf = Package.create();

      const entry = dbpf.add({
        type: 0,
        group: 0x800000000,
        instance: 0n
      }, StringTableResource.create({ entries: [
        { key: 1, value: "hi" }
      ]}));

      expect(() => entry.validate()).to.throw();
    });

    it("should throw if key instance is > 64 bit", () => {
      const dbpf = Package.create();

      const entry = dbpf.add({
        type: 0,
        group: 0,
        instance: 0x80000000000000000n
      }, StringTableResource.create({ entries: [
        { key: 1, value: "hi" }
      ]}));

      expect(() => entry.validate()).to.throw();
    });

    it("should throw if contained resource is invalid", () => {
      const dbpf = Package.create();

      const entry = dbpf.add({
        type: 0,
        group: 0,
        instance: 0x80000000000000000n
      }, StringTableResource.create({ entries: [
        { key: -1, value: "hi" }
      ]}));

      expect(() => entry.validate()).to.throw();
    });
  });

  describe("#valueEquals()", () => {
    // TODO:
  });

  //#endregion Public Methods
});
