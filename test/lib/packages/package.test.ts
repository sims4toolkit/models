import fs from "fs";
import path from "path";
import { expect } from "chai";
import compare from "just-compare";
import clone from "just-clone";
import BufferFromFilePlugin from "@s4tk/plugin-bufferfromfile";
import type { ResourceKey } from "../../../dst/lib/packages/types";
import { DdsImageResource, ObjectDefinitionResource, Package, RawResource, SimDataResource, StringTableResource, XmlResource } from "../../../dst/models";
import { registerPlugin } from "../../../dst/plugins";
import { BinaryResourceType, EncodingType, SimDataGroup, TuningResourceType } from "../../../dst/enums";
import { PackageFileReadingOptions } from "../../../dst/lib/common/options";
import { CompressionType } from "@s4tk/compression";

registerPlugin(BufferFromFilePlugin);

//#region Helpers

const cachedBuffers: { [key: string]: Buffer; } = {};

function getBuffer(filename: string): Buffer {
  if (!cachedBuffers[filename]) {
    const filepath = path.resolve(__dirname, `../../data/packages/${filename}.package`);
    cachedBuffers[filename] = fs.readFileSync(filepath);
  }

  return cachedBuffers[filename];
}

function getPackage(filename: string, options?: PackageFileReadingOptions): Package {
  return Package.from(getBuffer(filename), options);
}

function getTestTuning(): XmlResource {
  return new XmlResource(`<I n="something">\n  <T n="value">50</T>\n</I>`);
}

function getTestKey(): ResourceKey {
  return { type: TuningResourceType.Trait, group: 456, instance: 789n };
}

//#endregion Helpers

describe("Package", () => {
  //#region Properties

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
      dbpf.add(testKey, new XmlResource());
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

  describe("#constructor", () => {
    it("should create an empty dbpf if given list is empty", () => {
      const dbpf = new Package();
      expect(dbpf.size).to.equal(0);
    });

    it("should create entries from the ones that are given", () => {
      const dbpf = new Package([
        { key: getTestKey(), value: getTestTuning() }
      ]);

      expect(dbpf.size).to.equal(1);
      const entry = dbpf.get(0);
      expect(entry.keyEquals(getTestKey())).to.be.true;
      expect(entry.value.equals(getTestTuning())).to.be.true;
    });

    it("should assign itself as the owner of the given entries", () => {
      const dbpf = new Package([
        { key: getTestKey(), value: getTestTuning() }
      ]);

      const entry = dbpf.get(0);
      expect(entry.owner).to.equal(dbpf);
    });

    it("should assign IDs to the entries that are created", () => {
      const dbpf = new Package([
        { key: getTestKey(), value: getTestTuning() },
        { key: getTestKey(), value: getTestTuning() }
      ]);

      expect(dbpf.entries[0].id).to.equal(0);
      expect(dbpf.entries[1].id).to.equal(1);
    });
  });

  describe("static#extractResources()", () => {
    it("should return the entries of the dbpf", () => {
      const entries = Package.extractResources(getBuffer("CompleteTrait"));
      expect(entries).to.be.an('Array').with.lengthOf(4);
    });
  });

  describe("static#extractResourcesAsync()", () => {
    it("should return entries in a promise", () => {
      return Package.extractResourcesAsync(getBuffer("CompleteTrait")).then(entries => {
        expect(entries).to.be.an('Array').with.lengthOf(4);
      });
    });

    it("should reject the promise if there's an error", () => {
      return Package.extractResourcesAsync(getBuffer("Corrupt")).then().catch(err => {
        expect(err).to.be.instanceOf(Error);
      });
    });
  });

  describe("static#from()", () => {
    context("dbpf is valid", () => {
      it("should read empty dbpf", () => {
        const dbpf = getPackage("Empty");
        expect(dbpf.size).to.equal(0);
      });

      it("should read dbpf with entries", () => {
        const dbpf = getPackage("CompleteTrait");
        expect(dbpf.size).to.equal(4);
      });

      it("should not have cached entries by default", () => {
        const dbpf = Package.from(getBuffer("CompleteTrait"));
        dbpf.entries.forEach((entry, i) => {
          if (i > 0) // 0 is DST
            expect(entry.value.hasBufferCache).to.be.false;
        });
      });

      it("should have cached resources within its entries if saveBuffer = true", () => {
        const dbpf = Package.from(getBuffer("CompleteTrait"), { saveBuffer: true });
        dbpf.entries.forEach(entry => {
          expect(entry.value.hasBufferCache).to.be.true;
        });
      });

      it("should not have cached resources within its entries if saveBuffer = false", () => {
        const dbpf = Package.from(getBuffer("CompleteTrait"), { saveBuffer: false });
        dbpf.entries.forEach((entry, i) => {
          if (i > 0) // 0 is DST
            expect(entry.value.hasBufferCache).to.be.false;
        });
      });

      it("should not have cached resources within its entries by default", () => {
        const dbpf = Package.from(getBuffer("CompleteTrait"));
        dbpf.entries.forEach((entry, i) => {
          if (i > 0) // 0 is DST
            expect(entry.value.hasBufferCache).to.be.false;
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
        const simdata = entry.value as unknown as SimDataResource;
        expect(compare(key, {
          type: 0x545AC67A,
          group: 0x005FDD0C,
          instance: 0x97297134D57FE219n
        })).to.be.true;
        expect(simdata.instance.name).to.equal("frankkulak_LB:trait_SimlishNative");
        expect(simdata.props.display_name.asAny.value).to.equal(0x4EB3C46C);
      });

      it("should read obj definition resource correctly", () => {
        const dbpf = getPackage("TartosianoTextbook");
        const entry = dbpf.get(0);
        const key = entry.key;
        const def = entry.value as unknown as ObjectDefinitionResource;

        expect(compare(key, {
          type: BinaryResourceType.ObjectDefinition,
          group: 0x80000000,
          instance: 0xCE7661235557D998n
        })).to.be.true;

        expect(def.encodingType).to.equal(EncodingType.OBJDEF);
      });

      it("should read static resource correctly", () => {
        const dbpf = getPackage("CompleteTrait");
        const entry = dbpf.get(0);
        const key = entry.key;
        const image = entry.value as RawResource;
        expect(compare(key, {
          type: 0x00B2D882,
          group: 0,
          instance: 0x0B3417C01CCD98FEn
        })).to.be.true;
        expect(image.encodingType).to.equal(EncodingType.DDS);
      });

      it("should read DDS/DST resources correctly", () => {
        const dbpf = getPackage("DdsImages") as Package<DdsImageResource>;
        const dds = dbpf.get(0).resource;
        const dst = dbpf.get(1).resource;
        expect(dds.encodingType).to.equal(EncodingType.DDS);
        expect(dds.image.isShuffled).to.be.false;
        expect(dst.encodingType).to.equal(EncodingType.DDS);
        expect(dst.image.isShuffled).to.be.true;
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

      it("should read internally compressed resources correctly", () => {
        const dbpf = getPackage("InternalCompression");
        expect(dbpf.size).to.equal(1);
        expect(dbpf.get(0).resource.encodingType).to.equal(EncodingType.STBL);
      });

      it("should not exceed a limit of 1 when there is a resource filter", () => {
        const dbpf = Package.from(getBuffer("CompleteTrait"), {
          limit: 1,
          resourceFilter(type) {
            return type === BinaryResourceType.SimData
              || type === BinaryResourceType.StringTable;
          }
        });

        expect(dbpf.size).to.equal(1);
      });

      it("should not exceed a limit of 2 when there is a resource filter", () => {
        const dbpf = Package.from(getBuffer("CompleteTrait"), {
          limit: 2,
          resourceFilter(type) {
            return type === BinaryResourceType.SimData
              || type === BinaryResourceType.StringTable;
          }
        });

        expect(dbpf.size).to.equal(2);
      });

      it("should not exceed a limit of 1 when there is not a resource filter", () => {
        const dbpf = Package.from(getBuffer("CompleteTrait"), {
          limit: 1
        });

        expect(dbpf.size).to.equal(1);
      });

      it("should not exceed a limit of 1 when there is not a resource filter", () => {
        const dbpf = Package.from(getBuffer("CompleteTrait"), {
          limit: 2
        });

        expect(dbpf.size).to.equal(2);
      });
    });

    context("dbpf header is invalid", () => {
      it("should throw if recoveryMode = false", () => {
        expect(() => Package.from(getBuffer("CorruptHeader"), { recoveryMode: false })).to.throw();
      });

      it("should not throw if recoveryMode = true", () => {
        expect(() => Package.from(getBuffer("CorruptHeader"), { recoveryMode: true })).to.not.throw();
      });

      it("should return a regular DBPF if recoveryMode = true", () => {
        const dbpf = Package.from(getBuffer("CorruptHeader"), { recoveryMode: true });
        expect(dbpf.size).to.equal(2);
      });
    });

    context("dbpf content is invalid", () => {
      it("should throw if recoveryMode = false", () => {
        expect(() => Package.from(getBuffer("Corrupt"), { recoveryMode: false })).to.throw();
      });

      it("should throw even if recoveryMode = true", () => {
        expect(() => Package.from(getBuffer("Corrupt"), { recoveryMode: true })).to.throw();
      });
    });

    context("setting other options", () => {
      context("resourceFilter", () => {
        it("should return all resources if not provided", () => {
          const dbpf = Package.from(getBuffer("CompleteTrait"));
          expect(dbpf.size).to.equal(4);
        });

        it("should only return resources that pass the filter", () => {
          const dbpf = Package.from(getBuffer("CompleteTrait"), {
            resourceFilter(type, group, instance) {
              return type === BinaryResourceType.SimData || (type in TuningResourceType);
            }
          });

          expect(dbpf.size).to.equal(2);
          expect((dbpf.get(0).resource as unknown as SimDataResource).schema.name).to.equal("Trait");
          expect((dbpf.get(1).resource as XmlResource).root.attributes.i).to.equal("trait");
        });
      });

      context("recoveryMode", () => {
        function bufferWithCorruptResource(): Buffer {
          const dbpf = getPackage("Trait");

          const stbl = new StringTableResource([
            { key: 1, value: "hi" },
            { key: 2, value: "bye" }
          ]);

          const stblBuffer = stbl.getBuffer();
          stblBuffer.write("haha ur broken now");

          dbpf.add({
            type: BinaryResourceType.StringTable,
            group: 0x80000000,
            instance: 12345n
          }, RawResource.from(stblBuffer));

          return dbpf.getBuffer();
        }

        it("should throw if false and a resource is corrupt", () => {
          expect(() => Package.from(bufferWithCorruptResource())).to.throw();
        });

        it("should load a corrupt resource as raw if true", () => {
          const dbpf = Package.from(bufferWithCorruptResource(), {
            recoveryMode: true
          });

          expect(dbpf.size).to.equal(3);
          expect(dbpf.get(0).resource.encodingType).to.equal(EncodingType.DATA);
          expect(dbpf.get(1).resource.encodingType).to.equal(EncodingType.XML);
          expect(dbpf.get(2).resource.encodingType).to.equal(EncodingType.Unknown);
        });
      });

      context("loadRaw", () => {
        it("should load all resources as raw if true", () => {
          const dbpf = Package.from(getBuffer("CompleteTrait"), {
            loadRaw: true
          });

          expect(dbpf.size).to.equal(4);
          dbpf.entries.forEach(entry => {
            expect(entry.resource.encodingType).to.equal(EncodingType.Unknown);
          });
        });

        it("should load all resources into their models if false", () => {
          const dbpf = Package.from(getBuffer("CompleteTrait"), {
            loadRaw: false
          });

          expect(dbpf.size).to.equal(4);
          expect(dbpf.get(0).resource.encodingType).to.equal(EncodingType.DDS);
          expect(dbpf.get(1).resource.encodingType).to.equal(EncodingType.DATA);
          expect(dbpf.get(2).resource.encodingType).to.equal(EncodingType.XML);
          expect(dbpf.get(3).resource.encodingType).to.equal(EncodingType.STBL);
        });
      });

      context("decompressBuffers", () => {
        it("should not decompress raw resources using ZLIB by default", () => {
          const dbpf = Package.from(getBuffer("Trait"), {
            loadRaw: true
          });

          dbpf.entries.forEach(entry => {
            expect(entry.resource.encodingType).to.equal(EncodingType.Unknown);
            expect(entry.resource.bufferCache.compressionType).to.equal(CompressionType.ZLIB);
            expect(entry.resource.defaultCompressionType).to.equal(CompressionType.ZLIB);
          });
        });

        it("should not decompress raw resources using Internal Compression by default", () => {
          const dbpf = Package.from(getBuffer("InternalCompression"), {
            loadRaw: true
          });

          const entry = dbpf.get(0);
          expect(entry.resource.encodingType).to.equal(EncodingType.Unknown);
          expect(entry.resource.bufferCache.compressionType).to.equal(CompressionType.InternalCompression);
          expect(entry.resource.defaultCompressionType).to.equal(CompressionType.InternalCompression);
        });

        it("should not decompress raw resources using ZLIB if set to false", () => {
          const dbpf = Package.from(getBuffer("Trait"), {
            loadRaw: true,
            decompressBuffers: false
          });

          dbpf.entries.forEach(entry => {
            expect(entry.resource.encodingType).to.equal(EncodingType.Unknown);
            expect(entry.resource.bufferCache.compressionType).to.equal(CompressionType.ZLIB);
            expect(entry.resource.defaultCompressionType).to.equal(CompressionType.ZLIB);
          });
        });

        it("should not decompress raw resources using Internal Compression if set to false", () => {
          const dbpf = Package.from(getBuffer("InternalCompression"), {
            loadRaw: true,
            decompressBuffers: false
          });

          const entry = dbpf.get(0);
          expect(entry.resource.encodingType).to.equal(EncodingType.Unknown);
          expect(entry.resource.bufferCache.compressionType).to.equal(CompressionType.InternalCompression);
          expect(entry.resource.defaultCompressionType).to.equal(CompressionType.InternalCompression);
        });

        it("should decompress raw resources using ZLIB if set to true", () => {
          const dbpf = Package.from(getBuffer("Trait"), {
            loadRaw: true,
            decompressBuffers: true
          });

          dbpf.entries.forEach(entry => {
            expect(entry.resource.encodingType).to.equal(EncodingType.Unknown);
            expect(entry.resource.bufferCache.compressionType).to.equal(CompressionType.Uncompressed);
            expect(entry.resource.defaultCompressionType).to.equal(CompressionType.ZLIB);
          });
        });

        it("should decompress raw resources using Internal Compression if set to true", () => {
          const dbpf = Package.from(getBuffer("InternalCompression"), {
            loadRaw: true,
            decompressBuffers: true
          });

          const entry = dbpf.get(0);
          expect(entry.resource.encodingType).to.equal(EncodingType.Unknown);
          expect(entry.resource.bufferCache.compressionType).to.equal(CompressionType.Uncompressed);
          expect(entry.resource.defaultCompressionType).to.equal(CompressionType.InternalCompression);
        });
      });

      context("keepDeletedRecords", () => {
        it("should ignore deleted records if not provided", () => {
          const pkg = getPackage("DeletedRecord");
          expect(pkg.size).to.equal(0);
        });

        it("should ignore deleted records if false", () => {
          const pkg = getPackage("DeletedRecord", {
            keepDeletedRecords: false
          });

          expect(pkg.size).to.equal(0);
        });

        it("should get deleted records if true", () => {
          const pkg = getPackage("DeletedRecord", {
            keepDeletedRecords: true
          });

          expect(pkg.size).to.equal(1);
          expect(pkg.get(0).value.encodingType).to.equal(EncodingType.Null);
        });

        it("should not affect packages without deleted records if false", () => {
          const pkg = getPackage("CompleteTrait", {
            keepDeletedRecords: false
          });

          expect(pkg.size).to.equal(4);
          pkg.entries.forEach(entry => {
            expect(entry.value.encodingType).to.not.equal(EncodingType.Null);
          });
        });

        it("should not affect packages without deleted records if true", () => {
          const pkg = getPackage("CompleteTrait", {
            keepDeletedRecords: true
          });

          expect(pkg.size).to.equal(4);
          pkg.entries.forEach(entry => {
            expect(entry.value.encodingType).to.not.equal(EncodingType.Null);
          });
        });
      });
    });
  });

  describe("static#fromAsync()", () => {
    it("should return a package in a promise", () => {
      return Package.fromAsync(getBuffer("CompleteTrait")).then(dbpf => {
        expect(dbpf).to.be.instanceOf(Package);
        expect(dbpf.size).to.equal(4);
      });
    });

    it("should reject the promise if there's an error", () => {
      return Package.fromAsync(getBuffer("Corrupt")).then().catch(err => {
        expect(err).to.be.instanceOf(Error);
      });
    });
  });

  describe("static#streamResources()", () => {
    const filepath = path.resolve(
      __dirname,
      path.join("..", "..", "data", "packages", "CompleteTrait.package")
    );

    it("should read all of the resources if no filter or limit specified", () => {
      const resources = Package.streamResources(filepath);
      expect(resources).to.be.an("Array").with.lengthOf(4);
      expect(resources[0].value.encodingType).to.equal(EncodingType.DDS);
      expect(resources[1].value.encodingType).to.equal(EncodingType.DATA);
      expect(resources[2].value.encodingType).to.equal(EncodingType.XML);
      expect(resources[3].value.encodingType).to.equal(EncodingType.STBL);
    });

    it("should read no more resources than the limit", () => {
      const resources = Package.streamResources(filepath, { limit: 1 });
      expect(resources).to.be.an("Array").with.lengthOf(1);
      expect(resources[0].value.encodingType).to.equal(EncodingType.DDS);
    });

    it("should read only resources matching the filter", () => {
      const resources = Package.streamResources(filepath, {
        resourceFilter(type) {
          return type === BinaryResourceType.StringTable
            || type === BinaryResourceType.SimData
        }
      });

      expect(resources).to.be.an("Array").with.lengthOf(2);
      expect(resources[0].value.encodingType).to.equal(EncodingType.DATA);
      expect(resources[1].value.encodingType).to.equal(EncodingType.STBL);
    });

    it("should read only resources matching the filter up to the limit", () => {
      const resources = Package.streamResources(filepath, {
        resourceFilter(type) {
          return type === BinaryResourceType.StringTable
            || type === BinaryResourceType.SimData
        },
        limit: 1
      });

      expect(resources).to.be.an("Array").with.lengthOf(1);
      expect(resources[0].value.encodingType).to.equal(EncodingType.DATA);
    });
  });

  describe("static#fetchResources()", () => {
    const filepath = path.resolve(
      __dirname,
      path.join("..", "..", "data", "packages", "CompleteTrait.package")
    );

    context("pointing to one resource", () => {
      it("should extract static resource correctly", () => {
        const resources = Package.fetchResources<RawResource>(filepath, [
          {
            indexStart: 0x2C2D
          }
        ]);

        expect(resources).to.be.an("Array").with.lengthOf(1);
        expect(resources[0].key.instance).to.equal(0x0B3417C01CCD98FEn);
        expect(resources[0].value.encodingType).to.equal(EncodingType.DDS);
      });

      it("should extract simdata correctly", () => {
        const resources = Package.fetchResources<SimDataResource>(filepath, [
          {
            indexStart: 0x2C4D
          }
        ]);

        expect(resources).to.be.an("Array").with.lengthOf(1);
        const { key, value } = resources[0];
        expect(key.instance).to.equal(0x97297134D57FE219n);
        expect(value.encodingType).to.equal(EncodingType.DATA);
        expect(value.instance.name).to.equal("frankkulak_LB:trait_SimlishNative");
        expect(value.schema.columns[0].name).to.equal("ages");
      });

      it("should extract tuning correctly", () => {
        const resources = Package.fetchResources<XmlResource>(filepath, [
          {
            indexStart: 0x2C6D
          }
        ]);

        expect(resources).to.be.an("Array").with.lengthOf(1);
        const { key, value } = resources[0];
        expect(key.instance).to.equal(0x97297134D57FE219n);
        expect(value.encodingType).to.equal(EncodingType.XML);
        expect(value.root.name).to.equal("frankkulak_LB:trait_SimlishNative");
        expect(value.root.findChild("trait_type").innerValue).to.equal("GAMEPLAY");
      });

      it("should extract stbl correctly", () => {
        const resources = Package.fetchResources<StringTableResource>(filepath, [
          {
            indexStart: 0x2C8D
          }
        ]);

        expect(resources).to.be.an("Array").with.lengthOf(1);
        const { key, value } = resources[0];
        expect(key.instance).to.equal(0x0020097334286DF8n);
        expect(value.encodingType).to.equal(EncodingType.STBL);
        expect(value.size).to.equal(2);
        expect(value.get(0).value).to.equal("Simlish Native");
      });
    });

    context("pointing to multiple resources", () => {
      it("should extract the correct resources", () => {
        const resources = Package.fetchResources<SimDataResource>(filepath, [
          {
            indexStart: 0x2C4D
          },
          {
            indexStart: 0x2C6D
          }
        ]);

        expect(resources).to.be.an("Array").with.lengthOf(2);
        expect(resources[0].value.encodingType).to.equal(EncodingType.DATA);
        expect(resources[1].value.encodingType).to.equal(EncodingType.XML);
      });
    });
  });

  describe("static#indexResources()", () => {
    const filepath = path.resolve(
      __dirname,
      path.join("..", "..", "data", "packages", "CompleteTrait.package")
    );

    it("should return an index of all resources if no filter or limit", () => {
      const index = Package.indexResources(filepath);
      expect(index).to.be.an("Array").with.lengthOf(4);

      const [first, second, third, fourth] = index;

      expect(first.indexStart).to.equal(0x2C2D);
      expect(first.key?.type).to.equal(BinaryResourceType.DstImage);
      expect(first.key?.group).to.equal(0);
      expect(first.key?.instance).to.equal(0x0B3417C01CCD98FEn);
      expect(first.isDeleted).to.be.false;

      expect(second.indexStart).to.equal(0x2C4D);
      expect(second.key?.type).to.equal(BinaryResourceType.SimData);
      expect(second.key?.group).to.equal(SimDataGroup.Trait);
      expect(second.key?.instance).to.equal(0x97297134D57FE219n);
      expect(second.isDeleted).to.be.false;

      expect(third.indexStart).to.equal(0x2C6D);
      expect(third.key?.type).to.equal(TuningResourceType.Trait);
      expect(third.key?.group).to.equal(0);
      expect(third.key?.instance).to.equal(0x97297134D57FE219n);
      expect(third.isDeleted).to.be.false;

      expect(fourth.indexStart).to.equal(0x2C8D);
      expect(fourth.key?.type).to.equal(BinaryResourceType.StringTable);
      expect(fourth.key?.group).to.equal(0x80000000);
      expect(fourth.key?.instance).to.equal(0x0020097334286DF8n);
      expect(fourth.isDeleted).to.be.false;
    });

    it("should use isDeleted = true for deleted records if option provided", () => {
      const filepath = path.resolve(
        __dirname,
        path.join("..", "..", "data", "packages", "DeletedRecord.package")
      );

      const index = Package.indexResources(filepath, {
        keepDeletedRecords: true
      });

      expect(index).to.be.an("Array").with.lengthOf(1);
      expect(index[0].isDeleted).to.be.true;
    });

    it("should ignore deleted records if option not provided", () => {
      const filepath = path.resolve(
        __dirname,
        path.join("..", "..", "data", "packages", "DeletedRecord.package")
      );

      const index = Package.indexResources(filepath);
      expect(index).to.be.an("Array").that.is.empty;
    });

    it("should not exceed the limit that is given", () => {
      const index = Package.indexResources(filepath, { limit: 1 });
      expect(index).to.be.an("Array").with.lengthOf(1);

      const [first] = index;
      expect(first.indexStart).to.equal(0x2C2D);
      expect(first.key?.type).to.equal(BinaryResourceType.DstImage);
      expect(first.key?.group).to.equal(0);
      expect(first.key?.instance).to.equal(0x0B3417C01CCD98FEn);
    });

    it("should only return resources that pass the filter", () => {
      const index = Package.indexResources(filepath, {
        resourceFilter(type) {
          return type === BinaryResourceType.SimData
            || (type in TuningResourceType);
        }
      });

      expect(index).to.be.an("Array").with.lengthOf(2);

      const [second, third] = index;

      expect(second.indexStart).to.equal(0x2C4D);
      expect(second.key?.type).to.equal(BinaryResourceType.SimData);
      expect(second.key?.group).to.equal(SimDataGroup.Trait);
      expect(second.key?.instance).to.equal(0x97297134D57FE219n);

      expect(third.indexStart).to.equal(0x2C6D);
      expect(third.key?.type).to.equal(TuningResourceType.Trait);
      expect(third.key?.group).to.equal(0);
      expect(third.key?.instance).to.equal(0x97297134D57FE219n);
    });

    it("should only return resources that pass the filter up to the limit", () => {
      const index = Package.indexResources(filepath, {
        resourceFilter(type) {
          return type === BinaryResourceType.SimData
            || (type in TuningResourceType);
        },
        limit: 1
      });

      expect(index).to.be.an("Array").with.lengthOf(1);

      const [second] = index;
      expect(second.indexStart).to.equal(0x2C4D);
      expect(second.key?.type).to.equal(BinaryResourceType.SimData);
      expect(second.key?.group).to.equal(SimDataGroup.Trait);
      expect(second.key?.instance).to.equal(0x97297134D57FE219n);
    });
  });

  //#endregion Initialization

  //#region Public Methods

  describe("#add()", () => {
    it("should add the entry to an empty dbpf", () => {
      const dbpf = new Package();
      expect(dbpf.size).to.equal(0);
      const resource = new XmlResource();
      const testKey = getTestKey();
      dbpf.add(testKey, resource);
      expect(dbpf.size).to.equal(1);
      expect(compare(dbpf.get(0).key, testKey)).to.be.true;
      expect(dbpf.get(0).value).to.equal(resource);
    });

    it("should add the entry to a dbpf with entries", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.size).to.equal(4);
      const resource = new XmlResource();
      const testKey = getTestKey();
      dbpf.add(testKey, resource);
      expect(dbpf.size).to.equal(5);
      expect(compare(dbpf.get(4).key, testKey)).to.be.true;
      expect(dbpf.get(4).value).to.equal(resource);
    });

    it("should add the key to the key map", () => {
      const dbpf = new Package();
      const testKey = getTestKey();
      expect(dbpf.hasKey(testKey)).to.be.false;
      dbpf.add(testKey, new XmlResource());
      expect(dbpf.hasKey(testKey)).to.be.true;
    });

    it("should not uncache other entries", () => {
      const dbpf = getPackage("CompleteTrait", { saveBuffer: true });

      dbpf.entries.forEach(entry => {
        expect(entry.resource.hasBufferCache).to.be.true;
      });

      const testKey = getTestKey();
      dbpf.add(testKey, new XmlResource());

      dbpf.entries.forEach(entry => {
        if (entry.keyEquals(testKey)) {
          expect(entry.resource.hasBufferCache).to.be.false;
        } else {
          expect(entry.resource.hasBufferCache).to.be.true;
        }
      });
    });

    it("should assign an ID to the entry that is created", () => {
      const pkg = new Package();
      pkg.add(getTestKey(), getTestTuning());
      expect(pkg.entries[0].id).to.equal(0);
    });
  });

  describe("#addAll()", () => {
    it("should add the given entries", () => {
      const dbpf = new Package();

      expect(dbpf.size).to.equal(0);

      dbpf.addAll([
        {
          key: { type: 123, group: 456, instance: 789n },
          value: getTestTuning()
        },
        {
          key: { type: 321, group: 654, instance: 987n },
          value: new StringTableResource([{ key: 1, value: "hi" }])
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
      const [simdata, tuning] = clone.entries;
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
      //@ts-ignore
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
      expect(image.value.encodingType).to.equal(EncodingType.DDS);
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
      const dbpf = new Package();
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

      const dbpf = new Package([
        { key, value: new XmlResource("a") },
        { key, value: new XmlResource("b") },
      ]);

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

      const dbpf = new Package([
        { key, value: new XmlResource("a") },
        { key, value: new XmlResource("b") },
      ]);

      dbpf.delete(0);
      expect((dbpf.getByKey(key).value as XmlResource).content).to.equal("b");
    });
  });

  describe("#getByValue()", () => {
    it("should return undefined if no resources equal the one given", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.getByValue(getTestTuning())).to.be.undefined;
    });

    it("should be the entry that has an equal resource", () => {
      const dbpf = getPackage("CompleteTrait");
      dbpf.add(getTestKey(), getTestTuning());
      const id = dbpf.getIdForKey(dbpf.getByValue(getTestTuning()).key);
      expect(id).to.equal(4);
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

      const dbpf = new Package([
        { key, value: new XmlResource("a") },
        { key, value: new XmlResource("b") },
      ]);

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
      const dbpf = new Package();
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

      const dbpf = new Package([
        { key, value: new XmlResource("a") },
        { key, value: new XmlResource("b") },
      ]);

      expect(dbpf.hasKey(key)).to.be.true;
      dbpf.deleteByKey(key);
      expect(dbpf.hasKey(key)).to.be.true;
    });
  });

  describe("#hasValue()", () => {
    it("should return false if no resources equal the one given", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.hasValue(getTestTuning())).to.be.false;
    });

    it("should return true if there is a resource that is equal", () => {
      const dbpf = getPackage("CompleteTrait");
      dbpf.add(getTestKey(), getTestTuning());
      expect(dbpf.hasValue(getTestTuning())).to.be.true;
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
    it("should reset the entries", () => {
      const dbpf = getPackage("Trait");
      const entries = dbpf.entries;
      expect(entries).to.equal(dbpf.entries);
      dbpf.onChange();
      expect(entries).to.not.equal(dbpf.entries);
    });

    it("should not uncache the entries", () => {
      const dbpf = getPackage("Trait", { saveBuffer: true });
      dbpf.onChange();
      dbpf.entries.forEach(({ resource }) => {
        expect(resource.hasBufferCache).to.be.true;
      });
    });

    it("should not uncache the entries' resources", () => {
      const dbpf = getPackage("Trait", { saveBuffer: true });
      dbpf.onChange();
      dbpf.entries.forEach(entry => {
        expect(entry.value.hasBufferCache).to.be.true;
      });
    });
  });

  describe("#validate()", () => {
    it("should not throw if all entries are valid", () => {
      const dbpf = new Package([
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
          value: new StringTableResource([{ key: 1, value: "hi" }])
        }
      ]);

      expect(() => dbpf.validate()).to.not.throw();
    });

    it("should throw if at least one entry is not valid", () => {
      const dbpf = new Package([
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
          value: new StringTableResource([{ key: 1, value: "hi" }])
        }
      ]);

      expect(() => dbpf.validate()).to.throw();
    });

    it("should throw if there are multiple entries with the same key", () => {
      const dbpf = new Package([
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
          value: new StringTableResource([{ key: 1, value: "hi" }])
        }
      ]);

      expect(() => dbpf.validate()).to.throw();
    });
  });

  describe("#getBuffer()", () => {
    it("should serialize a dbpf that is empty", () => {
      const original = new Package();
      const dbpf = Package.from(original.getBuffer());
      expect(dbpf.size).to.equal(0);
    });

    it("should serialize a dbpf that wasn't changed, but was uncached", () => {
      const buffer = getBuffer("Trait");
      const original = Package.from(buffer);
      original.onChange();
      expect(original.getBuffer()).to.not.equal(buffer);
      const dbpf = Package.from(original.getBuffer());
      expect(dbpf.equals(original)).to.be.true;
    });

    it("should serialize a dbpf that had entries added", () => {
      const original = getPackage("Trait");
      expect(original.size).to.equal(2);
      const testKey = getTestKey();
      original.add(testKey, getTestTuning());
      const dbpf = Package.from(original.getBuffer());
      expect(dbpf.size).to.equal(3);
      expect(dbpf.get(2).keyEquals(testKey)).to.be.true;
      expect(dbpf.get(2).value.equals(getTestTuning())).to.be.true;
    });

    it("should serialize a dbpf that had entries removed", () => {
      const original = getPackage("Trait");
      expect(original.size).to.equal(2);
      original.delete(0);
      const dbpf = Package.from(original.getBuffer());
      expect(dbpf.size).to.equal(1);
      const tuning = dbpf.get(0).value as XmlResource;
      expect(tuning.encodingType).to.equal(EncodingType.XML);
      expect(tuning.root.name).to.equal("frankkulak_LB:trait_SimlishNative");
    });

    it("should serialize a dbpf that had entries mutated", () => {
      const original = getPackage("Trait");
      expect(original.size).to.equal(2);
      original.delete(0);
      const dbpf = Package.from(original.getBuffer());
      expect(dbpf.size).to.equal(1);
      const tuning = dbpf.get(0).value as XmlResource;
      expect(tuning.encodingType).to.equal(EncodingType.XML);
      expect(tuning.root.name).to.equal("frankkulak_LB:trait_SimlishNative");
    });
  });

  describe("#replaceEntries()", () => {
    it("should regenerate the entries' IDs", () => {
      const pkg = getPackage("Trait");
      pkg.delete(0);
      expect(pkg.get(1)).to.not.be.undefined;
      pkg.replaceEntries(pkg.entries);
      expect(pkg.get(1)).to.be.undefined;
    });

    it("should replace the existing entries", () => {
      const pkg = getPackage("Trait");

      pkg.replaceEntries([
        {
          key: {
            type: TuningResourceType.Trait,
            group: 0,
            instance: 12345n
          },
          value: getTestTuning()
        }
      ]);

      expect(pkg.size).to.equal(1);
      expect(pkg.get(0).key.instance).to.equal(12345n);
      expect(pkg.get(0).value.encodingType).to.equal(EncodingType.XML);
    });
  });

  //#endregion Public Methods
});
