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

  describe("static#readBinaryDataModel()", () => {
    it("should return a binary DATA model as a JSON", () => {
      const binaryModel = CombinedTuningResource.readBinaryDataModel(binaryBuffer);
      expect(binaryModel.mnVersion).to.equal(0x101);
      expect(binaryModel.mUnused).to.equal(0xFFFFFFFF);
      expect(binaryModel.mTable).to.be.an("Array").with.lengthOf(7);
      expect(binaryModel.mTable[0].name).to.equal("documents");
      expect(binaryModel.mSchema).to.be.an("Array").with.lengthOf(3);
      const schema = binaryModel.mSchema[0];
      expect(schema.name).to.equal("PackedXmlDocument");
      expect(schema.mColumn).to.be.an("Array").with.lengthOf(4);
    });
  });

  describe("static#combine()", () => {
    it("should create a new combined tuning that contains all given XMLs", () => {
      // TODO:
    });

    it("should use the provided seed", () => {
      // TODO:
    });
  });

  describe("static#combineAsync()", () => {
    it("should call combine() and return result in promise", () => {
      // TODO:
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

  describe("#isXml()", () => {
    it("should be true", () => {
      const cb = CombinedTuningResource.from(xmlBuffer);
      expect(cb.isXml()).to.be.true;
    });
  });

  describe("#clone()", () => {
    it("should copy the resource", () => {
      const cb = CombinedTuningResource.from(xmlBuffer);
      const clone = cb.clone();
      expect(clone).to.not.equal(cb);
    });

    it("should be equal to the original", () => {
      const cb = CombinedTuningResource.from(xmlBuffer);
      const clone = cb.clone();
      expect(clone.equals(cb)).to.be.true;
    });

    it("should not mutate the original", () => {
      const cb = CombinedTuningResource.from(xmlBuffer);
      const clone = cb.clone();
      clone.dom.child.tag = "not-combined";
      expect(clone.dom.child.tag).to.equal("not-combined");
      expect(cb.dom.child.tag).to.equal("combined");
    });
  });

  describe("#equals()", () => {
    it("should be true when they're the same", () => {
      const cb = CombinedTuningResource.from(xmlBuffer);
      const clone = cb.clone();
      expect(clone.equals(cb)).to.be.true;
    });

    it("should be false when they're not the same", () => {
      const cb = CombinedTuningResource.from(xmlBuffer);
      const clone = cb.clone();
      clone.dom.child.tag = "not-combined";
      expect(clone.equals(cb)).to.be.false;
    });
  });

  describe("#getBuffer()", () => {
    it("should return an XML buffer", () => {
      const cb = CombinedTuningResource.from(xmlBuffer);
      const buffer = cb.getBuffer();
      expect(xmlBuffer.compare(buffer)).to.equal(0);
    });

    it("should not include whitespace when minify = true", () => {
      // TODO:
    });
  });

  //#endregion Methods
});
