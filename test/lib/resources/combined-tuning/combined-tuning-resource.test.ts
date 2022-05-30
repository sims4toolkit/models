import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import { CombinedTuningResource, XmlResource } from "../../../../dst/models";
import { EncodingType } from "../../../../dst/enums";

//#region Helpers

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

function getExtractedXmlBuffer(name: string): Buffer {
  return fs.readFileSync(
    path.resolve(
      __dirname,
      "../../../data/combined-tuning/extracted", name + ".xml"
    )
  );
}

function testExtractedXml(resource: XmlResource, name: string, id: string) {
  expect(resource.root.name).to.equal(name);
  expect(resource.root.id).to.equal(id);
  expect(resource.dom.toXml()).to.equal(
    getExtractedXmlBuffer(name).toString()
  );
}

//#endregion Helpers

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
      const getResources = () => CombinedTuningResource.extractTuning(binaryBuffer);

      it("should extract the resources correctly", () => {
        const resources = getResources();
        expect(resources).to.be.an("Array").with.lengthOf(4);
        const [xml0, xml1, xml2, xml3] = resources;

        resources.forEach(resource => {
          expect(resource.encodingType).to.equal(EncodingType.XML);
        });

        testExtractedXml(xml0, "object_sitSofa3x1_SP23ISLwood", "268929");
        testExtractedXml(xml1, "object_sitLiving_SP23ISLwood", "268930");
        testExtractedXml(xml2, "object_Fountain_SP23", "268920");
        testExtractedXml(xml3, "object_lightFloor_SP23ISLlantern", "268934");
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
      const getResources = () => CombinedTuningResource.extractTuning(xmlBuffer);

      // TODO:
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
