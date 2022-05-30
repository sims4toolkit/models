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

  //#region Initialization

  // pointless to test constructor

  // TODO: from

  // TODO: fromAsync

  //#endregion Initialization

  //#region Static Methods

  // TODO: extractTuning

  // TODO: extractTuningAsync

  //#endregion Methods

  //#region Static Methods

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
