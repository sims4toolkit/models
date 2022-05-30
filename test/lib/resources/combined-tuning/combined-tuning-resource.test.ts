import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import { CombinedTuningResource } from "../../../../dst/models";
import { EncodingType } from "../../../../dst/enums";

const binaryBuffer = fs.readFileSync(
  path.resolve(
    __dirname,
    "../../../data/combined-tuning/binary/SP23_CombinedTuning.binary")
);

const xmlBuffer = fs.readFileSync(
  path.resolve(
    __dirname,
    "../../../data/combined-tuning/xml/SP23_CombinedTuning.xml"
  )
);

describe("CombinedTuningResource", () => {
  //#region Properties

  describe("#encodingType", () => {
    it("should be EncodingType.DATA", () => {
      const cb = CombinedTuningResource.from(xmlBuffer);
      expect(cb.encodingType).to.equal(EncodingType.DATA);
    });
  });

  //#endregion Properties

  //#region Static Methods

  describe("static#from()", () => {
    context("binary buffer", () => {
      it("should create a DOM equal to the XML version", () => {
        const cb = CombinedTuningResource.from(binaryBuffer);
        const domString = cb.dom.toXml();
        expect(domString).to.equal(xmlBuffer.toString());
      });
    });

    context("xml buffer", () => {
      it("should create a DOM equal to the XML version", () => {
        const cb = CombinedTuningResource.from(xmlBuffer);
        const domString = cb.dom.toXml();
        expect(domString).to.equal(xmlBuffer.toString());
      });
    });
  });

  describe("static#extractTuning()", () => {
    context("binary buffer", () => {
      const getCb = () => CombinedTuningResource.from(binaryBuffer);

      it("should extract the right number of resources", () => {
        // TODO:
      });

      it("should extract the resources correctly", () => {
        // TODO:
      });

      it("should restore string comments if provided a map", () => {
        // TODO:
      });

      it("should restore tuning ID comments if provided a map", () => {
        // TODO:
      });

      it("should filter which resources are read if given a filter fn", () => {
        // TODO:
      });
    });

    context("xml buffer", () => {
      const getCb = () => CombinedTuningResource.from(xmlBuffer);

      it("should extract the right number of resources", () => {
        // TODO:
      });

      it("should extract the resources correctly", () => {
        // TODO:
      });

      it("should restore string comments if provided a map", () => {
        // TODO:
      });

      it("should restore tuning ID comments if provided a map", () => {
        // TODO:
      });

      it("should filter which resources are read if given a filter fn", () => {
        // TODO:
      });
    });
  });

  //#endregion Static Methods

  //#region Methods

  describe("#isxml()", () => {
    it("should be false", () => {
      const cb = CombinedTuningResource.from(xmlBuffer);
      expect(cb.isXml()).to.be.false;
    });
  });

  describe("#clone()", () => {
    it("should throw an exception", () => {
      const cb = CombinedTuningResource.from(xmlBuffer);
      expect(() => cb.clone()).to.throw("Cloning CombinedTuningResource is not supported.");
    });
  });

  describe("#equals()", () => {
    it("should throw an exception", () => {
      const cb = CombinedTuningResource.from(xmlBuffer);
      expect(() => cb.equals(cb)).to.throw("Comparing CombinedTuningResource is not supported.");
    });
  });

  describe("#getBuffer()", () => {
    it("should throw an exception if buffer not saved", () => {
      const cb = CombinedTuningResource.from(xmlBuffer);
      expect(() => cb.getBuffer()).to.throw("Serializing CombinedTuningResource is not supported.");
    });
  });

  //#endregion Methods
});
