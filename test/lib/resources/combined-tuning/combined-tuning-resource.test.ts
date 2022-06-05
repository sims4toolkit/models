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
  expect(resource.dom.toXml().replace(/\r?\n|\r/g, "")).to.equal(
    getExtractedXmlBuffer(name).toString().replace(/\r?\n|\r/g, "")
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
        const domString = cb.dom.toXml().replace(/\r?\n|\r/g, "");
        expect(domString).to.equal(xmlBuffer.toString().replace(/\r?\n|\r/g, ""));
      });
    });

    context("xml buffer", () => {
      it("should create a DOM equal to the XML version", () => {
        const cb = CombinedTuningResource.from(xmlBuffer);
        const domString = cb.dom.toXml().replace(/\r?\n|\r/g, "");
        expect(domString).to.equal(xmlBuffer.toString().replace(/\r?\n|\r/g, ""));
      });
    });
  });

  describe("static#extractTuning()", () => {
    context("binary buffer", () => {
      const getBuffer = () => binaryBuffer;

      it("should extract the resources correctly", () => {
        const resources = CombinedTuningResource.extractTuning(getBuffer());
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

      it("should restore comments if provided a map", () => {
        const resources = CombinedTuningResource.extractTuning(getBuffer(), {
          commentMap: new Map([
            ["13328", "debug_Reset"]
          ])
        });

        const first = resources[0];
        const debugResetNode = first.root.findChild("_super_affordances").child;
        // NOTE: this should change in the future...
        // it should be an actual comment node
        expect(debugResetNode.numChildren).to.equal(1);
        expect(debugResetNode.innerValue).to.equal("13328<!--debug_Reset-->");
      });

      it("should filter which resources are read if given a filter fn", () => {
        const resources = CombinedTuningResource.extractTuning(getBuffer(), {
          filter(node) {
            return node.name === "object_Fountain_SP23"
          }
        });

        expect(resources).to.have.lengthOf(1);
        testExtractedXml(resources[0], "object_Fountain_SP23", "268920");
      });
    });

    context("xml buffer", () => {
      const getBuffer = () => xmlBuffer;

      it("should extract the resources correctly", () => {
        const resources = CombinedTuningResource.extractTuning(getBuffer());
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

      it("should restore comments if provided a map", () => {
        const resources = CombinedTuningResource.extractTuning(getBuffer(), {
          commentMap: new Map([
            ["13328", "debug_Reset"]
          ])
        });

        const first = resources[0];
        const debugResetNode = first.root.findChild("_super_affordances").child;
        // NOTE: this should change in the future...
        // it should be an actual comment node
        expect(debugResetNode.numChildren).to.equal(1);
        expect(debugResetNode.innerValue).to.equal("13328<!--debug_Reset-->");
      });

      it("should filter which resources are read if given a filter fn", () => {
        const resources = CombinedTuningResource.extractTuning(getBuffer(), {
          filter(node) {
            return node.name === "object_Fountain_SP23"
          }
        });

        expect(resources).to.have.lengthOf(1);
        testExtractedXml(resources[0], "object_Fountain_SP23", "268920");
      });
    });
  });

  //#endregion Static Methods

  //#region Methods

  describe("#toTuning()", () => {
    it("should extract the resources correctly", () => {
      const cb = CombinedTuningResource.from(xmlBuffer);
      const resources = cb.toTuning();
      const [xml0, xml1, xml2, xml3] = resources;

      resources.forEach(resource => {
        expect(resource.encodingType).to.equal(EncodingType.XML);
      });

      testExtractedXml(xml0, "object_sitSofa3x1_SP23ISLwood", "268929");
      testExtractedXml(xml1, "object_sitLiving_SP23ISLwood", "268930");
      testExtractedXml(xml2, "object_Fountain_SP23", "268920");
      testExtractedXml(xml3, "object_lightFloor_SP23ISLlantern", "268934");
    });

    it("should restore comments if provided a map", () => {
      const cb = CombinedTuningResource.from(xmlBuffer);
      const resources = cb.toTuning({
        commentMap: new Map([
          ["13328", "debug_Reset"]
        ])
      });

      const first = resources[0];
      const debugResetNode = first.root.findChild("_super_affordances").child;
      // NOTE: this should change in the future...
      // it should be an actual comment node
      expect(debugResetNode.numChildren).to.equal(1);
      expect(debugResetNode.innerValue).to.equal("13328<!--debug_Reset-->");
    });

    it("should filter which resources are read if given a filter fn", () => {
      const cb = CombinedTuningResource.from(xmlBuffer);
      const resources = cb.toTuning({
        filter(node) {
          return node.name === "object_Fountain_SP23"
        }
      });

      expect(resources).to.have.lengthOf(1);
      testExtractedXml(resources[0], "object_Fountain_SP23", "268920");
    });
  });

  //#endregion Methods

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
