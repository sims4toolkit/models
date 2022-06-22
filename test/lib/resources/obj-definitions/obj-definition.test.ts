import fs from "fs";
import path from "path";
import { expect } from "chai";
import { ObjectDefinitionResource } from "../../../../dst/models";
import { EncodingType, ObjectDefinitionPropertyType } from "../../../../dst/enums";
import MockOwner from "../../../mocks/mock-owner";

const tartosianoBuffer = fs.readFileSync(
  path.resolve(
    __dirname,
    "../../../data/obj-definitions/TartosianoTextbook.binary"
  )
);

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
    // TODO:
  });

  describe("#from()", () => {
    // TODO:
  });

  describe("#fromAsync()", () => {
    // TODO:
  });

  //#endregion Initialization

  //#region Methods

  describe("#clone()", () => {
    // TODO:
  });

  describe("#equals()", () => {
    // TODO:
  });

  describe("#getBuffer()", () => {
    // TODO:
  });

  describe("#isXml()", () => {
    // TODO:
  });

  describe("#onChange()", () => {
    // TODO:
  });

  //#endregion Methods
});
