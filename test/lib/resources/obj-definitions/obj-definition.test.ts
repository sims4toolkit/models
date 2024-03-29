import fs from "fs";
import path from "path";
import { expect } from "chai";
import { ObjectDefinitionResource } from "../../../../dst/models";
import { EncodingType, ObjectDefinitionType } from "../../../../dst/enums";
import MockOwner from "../../../mocks/mock-owner";
import { ObjectDefinitionProperties } from "../../../../dst/lib/resources/object-definition/types";
import { CompressionType } from "@s4tk/compression";

//#region Helpers & Variables

const getBuffer = (filename: string) => fs.readFileSync(
  path.resolve(
    __dirname,
    `../../../data/obj-definitions/${filename}.binary`
  )
);

const tartosianoBuffer = getBuffer("TartosianoTextbook");
const emptyBuffer = getBuffer("EmptyDefinition");
const randomPropsBuffer = getBuffer("RandomProperties");
const badVersionBuffer = getBuffer("Version3");
const unknownsBuffer = getBuffer("UnknownTypes");

//#endregion Helpers & Variables

describe("ObjectDefinitionResource", () => {
  //#region Properties

  describe("#encodingType", () => {
    it("should be OBJDEF", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer);
      expect(def.encodingType).to.equal(EncodingType.OBJDEF);
    });
  });

  describe("#properties", () => {
    it("should not uncache the owner when mutated", () => {
      const owner = new MockOwner();
      const def = ObjectDefinitionResource.from(tartosianoBuffer, {
        owner
      });

      expect(owner.cached).to.be.true;
      def.properties.isBaby = true;
      expect(owner.cached).to.be.true;
    });

    it("should not uncache the owner when values mutated", () => {
      const owner = new MockOwner();
      const def = ObjectDefinitionResource.from(tartosianoBuffer, {
        owner
      });

      expect(owner.cached).to.be.true;
      def.properties.components!.push(123);
      expect(owner.cached).to.be.true;
    });

    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const def = ObjectDefinitionResource.from(tartosianoBuffer, {
        owner
      });

      expect(owner.cached).to.be.true;
      def.properties = def.properties;
      expect(owner.cached).to.be.false;
    });
  });

  describe("#version", () => {
    it("should be 2", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer);
      expect(def.version).to.equal(2);
    });

    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const def = ObjectDefinitionResource.from(tartosianoBuffer, {
        owner
      });

      expect(owner.cached).to.be.true;
      def.version = 3;
      expect(owner.cached).to.be.false;
    });
  });

  //#endregion Properties

  //#region Initialization

  describe("#constructor", () => {
    it("should use latest version if not provided", () => {
      const def = new ObjectDefinitionResource();
      expect(def.version).to.equal(2);
    });

    it("should use the provided version", () => {
      const def = new ObjectDefinitionResource({ version: 1 });
      expect(def.version).to.equal(1);
    });

    it("should have empty properties if none provided", () => {
      const def = new ObjectDefinitionResource();
      expect(def.properties).to.be.an("Object");
      expect(Object.keys(def.properties).length).to.equal(0);
    });

    it("should use the provided properties", () => {
      const properties: ObjectDefinitionProperties = {};
      const def = new ObjectDefinitionResource({ properties });
      expect(def.properties.isBaby).to.be.undefined;
      properties.isBaby = true;
      expect(def.properties.isBaby).to.be.true;
    });

    it("should be mutated if original properties are mutated", () => {
      const def = new ObjectDefinitionResource({
        properties: {
          isBaby: true
        }
      });

      expect(def.properties.isBaby).to.be.true;
    });

    it("should use ZLIB compression by default", () => {
      const def = new ObjectDefinitionResource();
      expect(def.defaultCompressionType).to.equal(CompressionType.ZLIB);
    });

    it("should use the provided defaultCompressionType", () => {
      const def = new ObjectDefinitionResource({
        defaultCompressionType: CompressionType.InternalCompression
      });

      expect(def.defaultCompressionType).to.equal(CompressionType.InternalCompression);
    });

    it("should not have any initial cache by default", () => {
      const def = new ObjectDefinitionResource();
      expect(def.bufferCache).to.be.undefined;
    });

    it("should use the provided initialBufferCache", () => {
      const initialBufferCache = {
        buffer: tartosianoBuffer,
        compressionType: CompressionType.Uncompressed,
        sizeDecompressed: tartosianoBuffer.byteLength
      };

      const def = new ObjectDefinitionResource({
        initialBufferCache
      });

      expect(def.bufferCache).to.equal(initialBufferCache);
    });

    it("should not have an owner by default", () => {
      const def = new ObjectDefinitionResource();
      expect(def.owner).to.be.undefined;
    });

    it("should use the provided owner", () => {
      const owner = new MockOwner();
      const def = new ObjectDefinitionResource({ owner });
      expect(def.owner).to.equal(owner);
    });
  });

  describe("#from()", () => {
    it("should get the correct Name value", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer);
      expect(def.properties.name).to.equal("frankk_LB:object_textbook_Tartosiano");
    });

    it("should get the correct Tuning value", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer);
      expect(def.properties.tuning).to.equal("frankk_LB:objectTuning_textbook_Tartosiano");
    });

    it("should get the correct MaterialVariant value", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer);
      expect(def.properties.materialVariant).to.equal("Set1-materialVariant");
    });

    it("should get the correct TuningId value", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer);
      expect(def.properties.tuningId).to.equal(10565256321594783463n);
    });

    it("should get the correct Icon value", () => {
      const def = ObjectDefinitionResource.from(randomPropsBuffer);
      expect(def.properties.icons).to.be.an("Array").with.lengthOf(2);
      expect(def.properties.icons![0].type).to.equal(0x12345678);
      expect(def.properties.icons![0].group).to.equal(0x0000001A);
      expect(def.properties.icons![0].instance).to.equal(0x1234567890ABCDEFn);
      expect(def.properties.icons![1].type).to.equal(0x12345678);
      expect(def.properties.icons![1].group).to.equal(0);
      expect(def.properties.icons![1].instance).to.equal(0xABCDEF1234567890n);
    });

    it("should get the correct Rig value", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer);
      expect(def.properties.rigs![0].type).to.equal(0x8EAF13DE);
      expect(def.properties.rigs![0].group).to.equal(0);
      expect(def.properties.rigs![0].instance).to.equal(0x1AB585368F4D8687n);
    });

    it("should get the correct Slot value", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer);
      expect(def.properties.slots![0].type).to.equal(0xD3044521);
      expect(def.properties.slots![0].group).to.equal(0);
      expect(def.properties.slots![0].instance).to.equal(0x1AB585368F4D8687n);
    });

    it("should get the correct Model value", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer);
      expect(def.properties.models![0].type).to.equal(0x01661233);
      expect(def.properties.models![0].group).to.equal(0);
      expect(def.properties.models![0].instance).to.equal(0x5CCFAD78FE4212BEn);
    });

    it("should get the correct Footprint value", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer);
      expect(def.properties.footprints![0].type).to.equal(0xD382BF57);
      expect(def.properties.footprints![0].group).to.equal(0x80000000);
      expect(def.properties.footprints![0].instance).to.equal(0x999BE3F885903910n);
    });

    it("should get the correct Components value", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer);
      expect(def.properties.components).to.be.an("Array").with.lengthOf(9);
      const [first, second, , , , , , , last] = def.properties.components!;
      expect(first).to.equal(573464449);
      expect(second).to.equal(3994535597);
      expect(last).to.equal(1069811801);
    });

    it("should get the correct SimoleonPrice value", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer);
      expect(def.properties.simoleonPrice).to.equal(250);
    });

    it("should get the correct ThumbnailGeometryState value", () => {
      const def = ObjectDefinitionResource.from(randomPropsBuffer);
      expect(def.properties.thumbnailGeometryState).to.equal(1234);
    });

    it("should get the correct PositiveEnvironmentScore value", () => {
      // intentionally blank, replace by env scores so it's NBD
    });

    it("should get the correct NegativeEnvironmentScore value", () => {
      // intentionally blank, replace by env scores so it's NBD
    });

    it("should get the correct EnvironmentScoreEmotionTags value", () => {
      const def = ObjectDefinitionResource.from(randomPropsBuffer);
      expect(def.properties.environmentScoreEmotionTags).to.be.an("Array").with.lengthOf(2);
      expect(def.properties.environmentScoreEmotionTags![0]).to.equal(323);
      expect(def.properties.environmentScoreEmotionTags![1]).to.equal(1917);
    });

    it("should get the correct EnvironmentScoreEmotionTags_32 value", () => {
      const def = ObjectDefinitionResource.from(randomPropsBuffer);
      expect(def.properties.environmentScoreEmotionTags_32).to.be.an("Array").with.lengthOf(2);
      expect(def.properties.environmentScoreEmotionTags_32![0]).to.equal(55363);
      expect(def.properties.environmentScoreEmotionTags_32![1]).to.equal(1677);
    });

    it("should get the correct EnvironmentScores value", () => {
      const def = ObjectDefinitionResource.from(randomPropsBuffer);
      expect(def.properties.environmentScores).to.be.an("Array").with.lengthOf(1);
      expect(def.properties.environmentScores![0]).to.equal(5);
    });

    it("should get the correct IsBaby value", () => {
      const def = ObjectDefinitionResource.from(randomPropsBuffer);
      expect(def.properties.isBaby).to.be.true;
    });

    it("should not have an UnknownMisc set if there are no unknowns", () => {
      const def = ObjectDefinitionResource.from(randomPropsBuffer);
      expect(def.properties.unknownMisc).to.be.undefined;
    });

    it("should not include keys for any properties that aren't defined", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer);
      expect(def.properties.isBaby).to.be.undefined;
      expect(def.properties.thumbnailGeometryState).to.be.undefined;
    });

    it("should include unknown types in the UnknownMisc set", () => {
      const def = ObjectDefinitionResource.from(unknownsBuffer);
      expect(def.properties.unknownMisc).to.be.a("Set");
      expect(def.properties.unknownMisc!.size).to.equal(1);
      expect(def.properties.unknownMisc!.has(0x4D2)).to.be.true;
    });

    it("should read an obj def with no properties", () => {
      const def = ObjectDefinitionResource.from(emptyBuffer);
      expect(Object.keys(def.properties).length).to.equal(0);
    });

    it("should use ZLIB compression by default", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer);
      expect(def.defaultCompressionType).to.equal(CompressionType.ZLIB);
    });

    it("should use the provided defaultCompressionType", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer, {
        defaultCompressionType: CompressionType.InternalCompression
      });

      expect(def.defaultCompressionType).to.equal(CompressionType.InternalCompression);
    });

    it("should not have an owner by default", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer);
      expect(def.owner).to.be.undefined;
    });

    it("should use the provided owner", () => {
      const owner = new MockOwner();
      const def = ObjectDefinitionResource.from(tartosianoBuffer, { owner });
      expect(def.owner).to.equal(owner);
    });

    it("should fail if version ≠ 2 by default", () => {
      expect(() => ObjectDefinitionResource.from(badVersionBuffer)).to.throw();
    });

    it("should not fail if version ≠ 2 but recoveryMode is true", () => {
      expect(() => ObjectDefinitionResource.from(badVersionBuffer, {
        recoveryMode: true
      })).to.not.throw();
    });

    it("should not cache the buffer by default", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer);
      expect(def.hasBufferCache).to.be.false;
    });

    it("should cache the buffer if saveBuffer is true", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer, {
        saveBuffer: true
      });

      expect(def.hasBufferCache).to.be.true;
    });
  });

  describe("#fromAsync()", () => {
    it("should return an obj def asynchronously", async () => {
      const def = await ObjectDefinitionResource.fromAsync(tartosianoBuffer);
      expect(def.encodingType).to.equal(EncodingType.OBJDEF);
    });

    it("should use the given options", async () => {
      const def = await ObjectDefinitionResource.fromAsync(tartosianoBuffer, {
        saveBuffer: true
      });

      expect(def.hasBufferCache).to.be.true;
    });
  });

  //#endregion Initialization

  //#region Methods

  describe("#clone()", () => {
    it("should copy the original's version", () => {
      const original = new ObjectDefinitionResource({ version: 3 });
      const clone = original.clone();
      expect(clone.version).to.equal(3);
    });

    it("should copy the original's properties", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          isBaby: true,
          components: [1, 2, 3],
          icons: [{
            type: 0x1234,
            group: 0,
            instance: 12345n
          }],
          name: "something",
          simoleonPrice: 500,
        }
      });

      const clone = original.clone();

      expect(Object.keys(clone.properties).length).to.equal(5);
      expect(clone.properties.isBaby).to.be.true;
      expect(clone.properties.components).to.be.an("Array").with.lengthOf(3);
      expect(clone.properties.components![0]).to.equal(1);
      expect(clone.properties.components![1]).to.equal(2);
      expect(clone.properties.components![2]).to.equal(3);
      expect(clone.properties.icons).to.be.an("Array").with.lengthOf(1);
      expect(clone.properties.icons![0].type).to.equal(0x1234);
      expect(clone.properties.icons![0].group).to.equal(0);
      expect(clone.properties.icons![0].instance).to.equal(12345n);
      expect(clone.properties.name).to.equal("something");
      expect(clone.properties.simoleonPrice).to.equal(500);
    });

    it("should copy the original's buffer cache if present", () => {
      const original = ObjectDefinitionResource.from(tartosianoBuffer, {
        saveBuffer: true
      });

      const clone = original.clone();
      expect(clone.hasBufferCache).to.be.true;
    });

    it("should not have buffer cache if original doesn't", () => {
      const original = new ObjectDefinitionResource();
      const clone = original.clone();
      expect(clone.hasBufferCache).to.be.false;
    });

    it("should copy the original's default compression type", () => {
      const original = ObjectDefinitionResource.from(tartosianoBuffer, {
        defaultCompressionType: CompressionType.InternalCompression
      });

      const clone = original.clone();
      expect(clone.defaultCompressionType).to.equal(CompressionType.InternalCompression);
    });

    it("should not copy the original's owner", () => {
      const owner = new MockOwner();
      const original = new ObjectDefinitionResource({ owner });
      const clone = original.clone();
      expect(original.owner).to.equal(owner);
      expect(clone.owner).to.be.undefined;
    });

    it("should not mutate the original's version", () => {
      const original = new ObjectDefinitionResource({ version: 2 });
      const clone = original.clone();
      clone.version = 3;
      expect(original.version).to.equal(2);
      expect(clone.version).to.equal(3);
    });

    it("should not mutate the original's properties", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          isBaby: true,
        }
      });

      const clone = original.clone();
      clone.properties = {
        isBaby: false
      };

      expect(original.properties.isBaby).to.be.true;
      expect(clone.properties.isBaby).to.be.false;
    });

    it("should not mutate the original's properties primitive values", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          isBaby: true,
        }
      });

      const clone = original.clone();
      clone.properties.isBaby = false;
      expect(original.properties.isBaby).to.be.true;
      expect(clone.properties.isBaby).to.be.false;
    });

    it("should not mutate the original's properties mutable values", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          models: [{
            type: 0x12345678,
            group: 0,
            instance: 12345n
          }]
        }
      });

      const clone = original.clone();
      clone.properties.models![0].group = 8;
      expect(original.properties.models![0].group).to.equal(0);
      expect(clone.properties.models![0].group).to.equal(8);
    });
  });

  describe("#equals()", () => {
    context("version is same", () => {
      context("properties are same", () => {
        it("should return true if all properties are exactly the same in same order", () => {
          const def1 = new ObjectDefinitionResource({
            properties: {
              isBaby: true,
              name: "something",
            }
          });

          const def2 = new ObjectDefinitionResource({
            properties: {
              isBaby: true,
              name: "something",
            }
          });

          expect(def1.equals(def2)).to.be.true;
        });

        it("should return true if all properties are exactly the same in different order", () => {
          const def1 = new ObjectDefinitionResource({
            properties: {
              isBaby: true,
              name: "something",
            }
          });

          const def2 = new ObjectDefinitionResource({
            properties: {
              name: "something",
              isBaby: true,
            }
          });

          expect(def1.equals(def2)).to.be.true;
        });

        it("should return true if icon key is different object but has same values", () => {
          const def1 = new ObjectDefinitionResource({
            properties: {
              icons: [
                {
                  type: 0x12345678,
                  group: 0,
                  instance: 12345n
                }
              ]
            }
          });

          const def2 = new ObjectDefinitionResource({
            properties: {
              icons: [
                {
                  type: 0x12345678,
                  group: 0,
                  instance: 12345n
                }
              ]
            }
          });

          expect(def1.equals(def2)).to.be.true;
        });

        it("should return true if components list is different object, but has same values in same order", () => {
          const def1 = new ObjectDefinitionResource({
            properties: {
              components: [1, 2, 3]
            }
          });

          const def2 = new ObjectDefinitionResource({
            properties: {
              components: [1, 2, 3]
            }
          });

          expect(def1.equals(def2)).to.be.true;
        });

        it("should return true if unknown misc set is different object, but has same values in same order", () => {
          const def1 = new ObjectDefinitionResource({
            properties: {
              isBaby: true,
              unknownMisc: new Set([1, 2, 3])
            }
          });

          const def2 = new ObjectDefinitionResource({
            properties: {
              isBaby: true,
              unknownMisc: new Set([1, 2, 3])
            }
          });

          expect(def1.equals(def2)).to.be.true;
        });
      });

      context("properties are different", () => {
        it("should return false if a primitive value is different", () => {
          const def1 = new ObjectDefinitionResource({
            properties: {
              isBaby: true,
            }
          });

          const def2 = new ObjectDefinitionResource({
            properties: {
              isBaby: false,
            }
          });

          expect(def1.equals(def2)).to.be.false;
        });

        it("should return false if unknown sets contain different amounts", () => {
          const def1 = new ObjectDefinitionResource({
            properties: {
              isBaby: true,
              unknownMisc: new Set([1, 2, 3])
            }
          });

          const def2 = new ObjectDefinitionResource({
            properties: {
              isBaby: true,
              unknownMisc: new Set([2, 3, 4])
            }
          });

          expect(def1.equals(def2)).to.be.false;
        });

        it("should return false if this is a subset of that", () => {
          const def1 = new ObjectDefinitionResource({
            properties: {
              isBaby: true,
              name: "something"
            }
          });

          const def2 = new ObjectDefinitionResource({
            properties: {
              isBaby: true,
              name: "something",
              components: [1, 2, 3]
            }
          });

          expect(def1.equals(def2)).to.be.false;
        });

        it("should return false if that is a subset of this", () => {
          const def1 = new ObjectDefinitionResource({
            properties: {
              isBaby: true,
              name: "something"
            }
          });

          const def2 = new ObjectDefinitionResource({
            properties: {
              isBaby: true,
              name: "something",
              components: [1, 2, 3]
            }
          });

          expect(def2.equals(def1)).to.be.false;
        });

        it("should return false if components list is has same values, but in different order", () => {
          const def1 = new ObjectDefinitionResource({
            properties: {
              components: [1, 2, 3]
            }
          });

          const def2 = new ObjectDefinitionResource({
            properties: {
              components: [2, 1, 3]
            }
          });

          expect(def1.equals(def2)).to.be.false;
        });

        it("should return false if unknown misc set is different object, but has same values in different order", () => {
          const def1 = new ObjectDefinitionResource({
            properties: {
              isBaby: true,
              unknownMisc: new Set([1, 2, 3])
            }
          });

          const def2 = new ObjectDefinitionResource({
            properties: {
              isBaby: true,
              unknownMisc: new Set([3, 2, 1])
            }
          });

          expect(def1.equals(def2)).to.be.false;
        });
      });
    });

    context("version is different", () => {
      context("properties are same", () => {
        it("should return false", () => {
          const properties = {};

          const def1 = new ObjectDefinitionResource({
            version: 2,
            properties
          });

          const def2 = new ObjectDefinitionResource({
            version: 3,
            properties
          });

          expect(def1.properties).to.equal(def2.properties);
          expect(def1.equals(def2)).to.be.false;
        });
      });

      context("properties are different", () => {
        it("should return false", () => {
          const def1 = new ObjectDefinitionResource({
            version: 2,
            properties: {}
          });

          const def2 = new ObjectDefinitionResource({
            version: 3,
            properties: {
              isBaby: true
            }
          });

          expect(def1.properties).to.not.equal(def2.properties);
          expect(def1.equals(def2)).to.be.false;
        });
      });
    });
  });

  describe("#getBuffer()", () => {
    it("should write Components correctly", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          components: [1, 2, 3]
        }
      });

      const buffer = original.getBuffer();
      const def = ObjectDefinitionResource.from(buffer);
      expect(Object.keys(def.properties).length).to.equal(1);
      expect(def.properties.components).to.be.an("Array").with.lengthOf(3);
      const [first, second, third] = def.properties.components!;
      expect(first).to.equal(1);
      expect(second).to.equal(2);
      expect(third).to.equal(3);
    });

    it("should write EnvironmentScoreEmotionTags correctly", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          environmentScoreEmotionTags: [100, 250]
        }
      });

      const buffer = original.getBuffer();
      const def = ObjectDefinitionResource.from(buffer);
      expect(Object.keys(def.properties).length).to.equal(1);
      expect(def.properties.environmentScoreEmotionTags).to.be.an("Array").with.lengthOf(2);
      const [first, second] = def.properties.environmentScoreEmotionTags!;
      expect(first).to.equal(100);
      expect(second).to.equal(250);
    });

    it("should write EnvironmentScoreEmotionTags_32 correctly", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          environmentScoreEmotionTags_32: [100, 250]
        }
      });

      const buffer = original.getBuffer();
      const def = ObjectDefinitionResource.from(buffer);
      expect(Object.keys(def.properties).length).to.equal(1);
      expect(def.properties.environmentScoreEmotionTags_32).to.be.an("Array").with.lengthOf(2);
      const [first, second] = def.properties.environmentScoreEmotionTags_32!;
      expect(first).to.equal(100);
      expect(second).to.equal(250);
    });

    it("should write EnvironmentScores correctly", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          environmentScores: [1.5, -2.5]
        }
      });

      const buffer = original.getBuffer();
      const def = ObjectDefinitionResource.from(buffer);
      expect(Object.keys(def.properties).length).to.equal(1);
      expect(def.properties.environmentScores).to.be.an("Array").with.lengthOf(2);
      const [first, second] = def.properties.environmentScores!;
      expect(first).to.be.approximately(1.5, 0.001);
      expect(second).to.be.approximately(-2.5, 0.001);
    });

    it("should write Footprint correctly", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          footprints: [
            {
              type: 0x12345678,
              group: 0x80000000,
              instance: 0x1234567890n
            }
          ]
        }
      });

      const buffer = original.getBuffer();
      const def = ObjectDefinitionResource.from(buffer);
      expect(Object.keys(def.properties).length).to.equal(1);
      expect(def.properties.footprints).to.be.an("Array").with.lengthOf(1);
      const [first] = def.properties.footprints!;
      expect(first.type).to.equal(0x12345678);
      expect(first.group).to.equal(0x80000000);
      expect(first.instance).to.equal(0x1234567890n);
    });

    it("should write Icon correctly", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          icons: [
            {
              type: 0x12345678,
              group: 0x80000000,
              instance: 0x1234567890n
            }
          ]
        }
      });

      const buffer = original.getBuffer();
      const def = ObjectDefinitionResource.from(buffer);
      expect(Object.keys(def.properties).length).to.equal(1);
      expect(def.properties.icons).to.be.an("Array").with.lengthOf(1);
      const [first] = def.properties.icons!;
      expect(first.type).to.equal(0x12345678);
      expect(first.group).to.equal(0x80000000);
      expect(first.instance).to.equal(0x1234567890n);
    });

    it("should write IsBaby correctly", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          isBaby: true
        }
      });

      const buffer = original.getBuffer();
      const def = ObjectDefinitionResource.from(buffer);
      expect(Object.keys(def.properties).length).to.equal(1);
      expect(def.properties.isBaby).to.equal(true);
    });

    it("should write MaterialVariant correctly", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          materialVariant: "material"
        }
      });

      const buffer = original.getBuffer();
      const def = ObjectDefinitionResource.from(buffer);
      expect(Object.keys(def.properties).length).to.equal(1);
      expect(def.properties.materialVariant).to.equal("material");
    });

    it("should write Model correctly", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          models: [
            {
              type: 0x12345678,
              group: 0x80000000,
              instance: 0x1234567890n
            }
          ]
        }
      });

      const buffer = original.getBuffer();
      const def = ObjectDefinitionResource.from(buffer);
      expect(Object.keys(def.properties).length).to.equal(1);
      expect(def.properties.models).to.be.an("Array").with.lengthOf(1);
      const [first] = def.properties.models!;
      expect(first.type).to.equal(0x12345678);
      expect(first.group).to.equal(0x80000000);
      expect(first.instance).to.equal(0x1234567890n);
    });

    it("should write Name correctly", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          name: "something"
        }
      });

      const buffer = original.getBuffer();
      const def = ObjectDefinitionResource.from(buffer);
      expect(Object.keys(def.properties).length).to.equal(1);
      expect(def.properties.name).to.equal("something");
    });

    it("should write PositiveEnvironmentScore correctly", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          positiveEnvironmentScore: 1.2
        }
      });

      const buffer = original.getBuffer();
      const def = ObjectDefinitionResource.from(buffer);
      expect(Object.keys(def.properties).length).to.equal(1);
      expect(def.properties.positiveEnvironmentScore).to.be.approximately(1.2, 0.001);
    });

    it("should write NositiveEnvironmentScore correctly", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          negativeEnvironmentScore: -1.2
        }
      });

      const buffer = original.getBuffer();
      const def = ObjectDefinitionResource.from(buffer);
      expect(Object.keys(def.properties).length).to.equal(1);
      expect(def.properties.negativeEnvironmentScore).to.be.approximately(-1.2, 0.001);
    });

    it("should write Rig correctly", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          rigs: [
            {
              type: 0x12345678,
              group: 0x80000000,
              instance: 0x1234567890n
            }
          ]
        }
      });

      const buffer = original.getBuffer();
      const def = ObjectDefinitionResource.from(buffer);
      expect(Object.keys(def.properties).length).to.equal(1);
      expect(def.properties.rigs).to.be.an("Array").with.lengthOf(1);
      const [first] = def.properties.rigs!;
      expect(first.type).to.equal(0x12345678);
      expect(first.group).to.equal(0x80000000);
      expect(first.instance).to.equal(0x1234567890n);
    });

    it("should write SimoleonPrice correctly", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          simoleonPrice: 500
        }
      });

      const buffer = original.getBuffer();
      const def = ObjectDefinitionResource.from(buffer);
      expect(Object.keys(def.properties).length).to.equal(1);
      expect(def.properties.simoleonPrice).to.equal(500);
    });

    it("should write Slot correctly", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          slots: [
            {
              type: 0x12345678,
              group: 0x80000000,
              instance: 0x1234567890n
            },
            {
              type: 0x12345678,
              group: 0x0000000,
              instance: 0xABCDEFn
            }
          ]
        }
      });

      const buffer = original.getBuffer();
      const def = ObjectDefinitionResource.from(buffer);
      expect(Object.keys(def.properties).length).to.equal(1);
      expect(def.properties.slots).to.be.an("Array").with.lengthOf(2);
      const [first, second] = def.properties.slots!;
      expect(first.type).to.equal(0x12345678);
      expect(first.group).to.equal(0x80000000);
      expect(first.instance).to.equal(0x1234567890n);
      expect(second.type).to.equal(0x12345678);
      expect(second.group).to.equal(0x00000000);
      expect(second.instance).to.equal(0xABCDEFn);
    });

    it("should write ThumbnailGeometryState correctly", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          thumbnailGeometryState: 12345
        }
      });

      const buffer = original.getBuffer();
      const def = ObjectDefinitionResource.from(buffer);
      expect(Object.keys(def.properties).length).to.equal(1);
      expect(def.properties.thumbnailGeometryState).to.equal(12345);
    });

    it("should write Tuning correctly", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          tuning: "something"
        }
      });

      const buffer = original.getBuffer();
      const def = ObjectDefinitionResource.from(buffer);
      expect(Object.keys(def.properties).length).to.equal(1);
      expect(def.properties.tuning).to.equal("something");
    });

    it("should write TuningId correctly", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          tuningId: 0x1234567890ABCDEFn
        }
      });

      const buffer = original.getBuffer();
      const def = ObjectDefinitionResource.from(buffer);
      expect(Object.keys(def.properties).length).to.equal(1);
      expect(def.properties.tuningId).to.equal(0x1234567890ABCDEFn);
    });

    it("should write multiple properties correctly", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          tuningId: 0x1234567890ABCDEFn,
          isBaby: true,
          models: [
            {
              type: 1,
              group: 2,
              instance: 3n
            }
          ]
        }
      });

      const buffer = original.getBuffer();
      const def = ObjectDefinitionResource.from(buffer);
      expect(Object.keys(def.properties).length).to.equal(3);
      expect(def.properties.tuningId).to.equal(0x1234567890ABCDEFn);
      expect(def.properties.isBaby).to.be.true
      expect(def.properties.models).to.be.an("Array").with.lengthOf(1);
      expect(def.properties.models![0].type).to.equal(1);
      expect(def.properties.models![0].group).to.equal(2);
      expect(def.properties.models![0].instance).to.equal(3n);
    });

    it("should serialize an obj def with no properties", () => {
      const original = new ObjectDefinitionResource();
      const buffer = original.getBuffer();
      const def = ObjectDefinitionResource.from(buffer);
      expect(Object.keys(def.properties).length).to.equal(0);
    });

    it("should not write UnknownMisc", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          unknownMisc: new Set([1, 2, 3])
        }
      });

      const buffer = original.getBuffer();
      const def = ObjectDefinitionResource.from(buffer);
      expect(Object.keys(def.properties).length).to.equal(0);
    });

    it("should reserialize into an object that is equal to this one", () => {
      const original = new ObjectDefinitionResource({
        properties: {
          isBaby: true,
          name: "something",
          components: [1, 2, 3]
        }
      });

      const buffer = original.getBuffer();
      const def = ObjectDefinitionResource.from(buffer);
      expect(original.equals(def)).to.be.true;
    });
  });

  describe("#getProperty()", () => {
    it("should get the primitive value of the property for the given type", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer);
      const name = def.getProperty(ObjectDefinitionType.Name);
      expect(name).to.equal("frankk_LB:object_textbook_Tartosiano");
    });

    it("should get the mutable value of the property for the given type", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer);
      const components = def.getProperty(ObjectDefinitionType.Components) as number[];
      expect(components).to.be.an("Array").with.lengthOf(9);
      expect(components[0]).to.equal(573464449);
    });

    it("should return undefined if there is no property set for the given type", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer);
      const unknown4 = def.getProperty(ObjectDefinitionType.Unknown4);
      expect(unknown4).to.be.undefined;
    });
  });

  describe("#isXml()", () => {
    it("should always return false", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer);
      expect(def.isXml()).to.be.false;
    });
  });

  describe("#onChange()", () => {
    it("should delete the buffer cache", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer, {
        saveBuffer: true
      });

      expect(def.hasBufferCache).to.be.true;
      def.onChange();
      expect(def.hasBufferCache).to.be.false;
    });

    it("should uncache the owner", () => {
      const owner = new MockOwner();
      const def = ObjectDefinitionResource.from(tartosianoBuffer, {
        owner
      });

      expect(owner.cached).to.be.true;
      def.onChange();
      expect(owner.cached).to.be.false;
    });
  });

  describe("#setProperty()", () => {
    it("should set the primitive value of the property for the given type", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer, {
        saveBuffer: true
      });

      expect(def.properties.isBaby).to.be.undefined;
      def.setProperty(ObjectDefinitionType.IsBaby, true);
      expect(def.properties.isBaby).to.be.true;
    });

    it("should set the mutable value of the property for the given type", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer, {
        saveBuffer: true
      });

      expect(def.properties.components).to.be.an("Array").with.lengthOf(9);
      const newComponents = [1, 2, 3];
      def.setProperty(ObjectDefinitionType.Components, newComponents);
      expect(def.properties.components).to.equal(newComponents);
    });

    it("should uncache the buffer", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer, {
        saveBuffer: true
      });

      expect(def.hasBufferCache).to.be.true;
      def.setProperty(ObjectDefinitionType.IsBaby, true);
      expect(def.hasBufferCache).to.be.false;
    });

    it("should uncache the owner", () => {
      const owner = new MockOwner();
      const def = ObjectDefinitionResource.from(tartosianoBuffer, {
        owner,
        saveBuffer: true
      });

      expect(owner.cached).to.be.true;
      def.setProperty(ObjectDefinitionType.IsBaby, true);
      expect(owner.cached).to.be.false;
    });
  });

  describe("#updateProperties()", () => {
    it("should mutate the properties object", () => {
      const properties: ObjectDefinitionProperties = {};
      const def = new ObjectDefinitionResource({ properties });
      expect(properties.isBaby).to.be.undefined;
      def.updateProperties(props => {
        props.isBaby = true;
      });
      expect(properties.isBaby).to.be.true;
    });

    it("should uncache the buffer", () => {
      const def = ObjectDefinitionResource.from(tartosianoBuffer, {
        saveBuffer: true
      });

      expect(def.hasBufferCache).to.be.true;
      def.updateProperties(props => {
        props.isBaby = true;
      });
      expect(def.hasBufferCache).to.be.false;
    });

    it("should uncache the owner", () => {
      const owner = new MockOwner();
      const def = ObjectDefinitionResource.from(tartosianoBuffer, {
        owner,
        saveBuffer: true
      });

      expect(owner.cached).to.be.true;
      def.updateProperties(props => {
        props.isBaby = true;
      });
      expect(owner.cached).to.be.false;
    });
  });

  //#endregion Methods
});
