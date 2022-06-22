import fs from "fs";
import path from "path";
import { expect } from "chai";
import { ObjectDefinitionResource } from "../../../../dst/models";
import { EncodingType, ObjectDefinitionPropertyType } from "../../../../dst/enums";
import MockOwner from "../../../mocks/mock-owner";

//#region Helpers & Variables

const getBuffer = (filename: string) => fs.readFileSync(
  path.resolve(
    __dirname,
    `../../../data/obj-definitions/${filename}.binary`
  )
);

const tartosianoBuffer = getBuffer("TartosianoTextbook");

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
    // FIXME: this should be changed eventually
    it("should not uncache the owner when mutated", () => {
      const owner = new MockOwner();
      const def = ObjectDefinitionResource.from(tartosianoBuffer, {
        owner
      });

      expect(owner.cached).to.be.true;
      def.properties.IsBaby = true;
      expect(owner.cached).to.be.true;
    });

    // FIXME: this should be changed eventually
    it("should not uncache the owner when values mutated", () => {
      const owner = new MockOwner();
      const def = ObjectDefinitionResource.from(tartosianoBuffer, {
        owner
      });

      expect(owner.cached).to.be.true;
      def.properties.Components!.push(123);
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
    it("should use the provided version", () => {
      // TODO:
    });

    it("should use the provided properties", () => {
      // TODO:
    });

    it("should be mutated if original properties are mutated", () => {
      // TODO:
    });

    it("should use ZLIB compression by default", () => {
      // TODO:
    });

    it("should use the provided defaultCompressionType", () => {
      // TODO:
    });

    it("should not have any initial cache by default", () => {
      // TODO:
    });

    it("should use the provided initialBufferCache", () => {
      // TODO:
    });

    it("should not have an owner by default", () => {
      // TODO:
    });

    it("should use the provided owner", () => {
      // TODO:
    });
  });

  describe("#from()", () => {
    it("should get the correct Name value", () => {
      // TODO:
    });

    it("should get the correct Tuning value", () => {
      // TODO:
    });

    it("should get the correct MaterialVariant value", () => {
      // TODO:
    });

    it("should get the correct TuningId value", () => {
      // TODO:
    });

    it("should get the correct Icon value", () => {
      // TODO:
    });

    it("should get the correct Rig value", () => {
      // TODO:
    });

    it("should get the correct Slot value", () => {
      // TODO:
    });

    it("should get the correct Model value", () => {
      // TODO:
    });

    it("should get the correct Footprint value", () => {
      // TODO:
    });

    it("should get the correct Components value", () => {
      // TODO:
    });

    it("should get the correct SimoleonPrice value", () => {
      // TODO:
    });

    it("should get the correct ThumbnailGeometryState value", () => {
      // TODO:
    });

    it("should get the correct PositiveEnvironmentScore value", () => {
      // TODO:
    });

    it("should get the correct NegativeEnvironmentScore value", () => {
      // TODO:
    });

    it("should get the correct EnvironmentScoreEmotionTags value", () => {
      // TODO:
    });

    it("should get the correct EnvironmentScoreEmotionTags_32 value", () => {
      // TODO:
    });

    it("should get the correct EnvironmentScores value", () => {
      // TODO:
    });

    it("should get the correct IsBaby value", () => {
      // TODO:
    });

    it("should not have an UnknownMisc set if there are no unknowns", () => {
      // TODO:
    });

    it("should not include keys for any properties that aren't defined", () => {
      // TODO:
    });

    it("should include unknown types in the UnknownMisc set", () => {
      // TODO:
    });

    it("should use ZLIB compression by default", () => {
      // TODO:
    });

    it("should use the provided defaultCompressionType", () => {
      // TODO:
    });

    it("should not have an owner by default", () => {
      // TODO:
    });

    it("should use the provided owner", () => {
      // TODO:
    });

    it("should fail if version ≠ 2 by default", () => {
      // TODO:
    });

    it("should not fail if version ≠ 2 but recoveryMode is true", () => {
      // TODO:
    });

    it("should not cache the buffer by default", () => {
      // TODO:
    });

    it("should cache the buffer if saveBuffer is true", () => {
      // TODO:
    });
  });

  describe("#fromAsync()", () => {
    it("should return an obj def asynchronously", () => {
      // TODO:
    });

    it("should use the given options", () => {
      // TODO:
    });
  });

  //#endregion Initialization

  //#region Methods

  describe("#clone()", () => {
    it("should copy the original's version", () => {
      // TODO:
    });

    it("should copy the original's properties", () => {
      // TODO:
    });

    it("should copy the original's buffer cache if present", () => {
      // TODO:
    });

    it("should not have buffer cache if original doesn't", () => {
      // TODO:
    });

    it("should copy the original's default compression type", () => {
      // TODO:
    });

    it("should not copy the original's owner", () => {
      // TODO:
    });

    it("should not mutate the original's version", () => {
      // TODO:
    });

    it("should not mutate the original's properties", () => {
      // TODO:
    });

    it("should not mutate the original's properties primitive values", () => {
      // TODO:
    });

    it("should not mutate the original's properties mutable values", () => {
      // TODO:
    });
  });

  describe("#equals()", () => {
    context("version is same", () => {
      context("properties are same", () => {
        it("should return true if all properties are exactly the same in same order", () => {
          // TODO:
        });

        it("should return true if all properties are exactly the same in different order", () => {
          // TODO:
        });

        it("should return true if icon key is different object but has same values", () => {
          // TODO:
        });

        it("should return true if components list is different object, but has same values in same order", () => {
          // TODO:
        });

        it("should return true if unknown misc set is different object, but has same values in same order", () => {
          // TODO:
        });

        it("should return true if unknown misc set is different object, but has same values in different order", () => {
          // TODO:
        });
      });

      context("properties are different", () => {
        it("should return false if a primitive value is different", () => {
          // TODO:
        });

        it("should return false if unknown sets contain different amounts", () => {
          // TODO:
        });

        it("should return false if this is a subset of that", () => {
          // TODO:
        });

        it("should return false if that is a subset of this", () => {
          // TODO:
        });

        it("should return false if components list is has same values, but in different order", () => {
          // TODO:
        });
      });
    });

    context("version is different", () => {
      context("properties are same", () => {
        it("should return false", () => {
          // TODO:
        });
      });

      context("properties are different", () => {
        it("should return false", () => {
          // TODO:
        });
      });
    });
  });

  describe("#getBuffer()", () => {
    it("should write Components correctly", () => {
      // TODO:
    });

    it("should write EnvironmentScoreEmotionTags correctly", () => {
      // TODO:
    });

    it("should write EnvironmentScoreEmotionTags_32 correctly", () => {
      // TODO:
    });

    it("should write EnvironmentScores correctly", () => {
      // TODO:
    });

    it("should write Footprint correctly", () => {
      // TODO:
    });

    it("should write Icon correctly", () => {
      // TODO:
    });

    it("should write IsBaby correctly", () => {
      // TODO:
    });

    it("should write MaterialVariant correctly", () => {
      // TODO:
    });

    it("should write Model correctly", () => {
      // TODO:
    });

    it("should write Name correctly", () => {
      // TODO:
    });

    it("should write NegativeEnvironmentScore correctly", () => {
      // TODO:
    });

    it("should write PositiveEnvironmentScore correctly", () => {
      // TODO:
    });

    it("should write Rig correctly", () => {
      // TODO:
    });

    it("should write SimoleonPrice correctly", () => {
      // TODO:
    });

    it("should write Slot correctly", () => {
      // TODO:
    });

    it("should write ThumbnailGeometryState correctly", () => {
      // TODO:
    });

    it("should write Tuning correctly", () => {
      // TODO:
    });

    it("should write TuningId correctly", () => {
      // TODO:
    });

    it("should write Unknown1 correctly", () => {
      // TODO:
    });

    it("should write Unknown2 correctly", () => {
      // TODO:
    });

    it("should write Unknown3 correctly", () => {
      // TODO:
    });

    it("should write Unknown4 correctly", () => {
      // TODO:
    });

    it("should not write UnknownMisc", () => {
      // TODO:
    });

    it("should reserialize into an object that is equal to this one", () => {
      // TODO:
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

  //#endregion Methods
});
