import fs from "fs";
import path from "path";
import { expect } from "chai";
import { simDataFragments, SimDataResource } from "../../../dst/api";

const cachedBuffers: { [key: string]: Buffer; } = {};

function getBuffer(filename: string) {
  if (cachedBuffers[filename]) {
    return cachedBuffers[filename];
  } else {
    const folder = filename.split('.')[1] === "xml" ? "xml" : "binary";
    const filepath = path.resolve(__dirname, `../../data/simdatas/${folder}/${filename}`);
    const buffer = fs.readFileSync(filepath);
    cachedBuffers[filename] = buffer;
    return buffer;
  }
}

function getSimDataFromBinary(filename: string) {
  return SimDataResource.from(getBuffer(`${filename}.simdata`));
}

function getSimDataFromXml(filename: string) {
  return SimDataResource.fromXml(getBuffer(`${filename}.xml`));
}

describe("SimDataResource", () => {
  //#region Properties

  describe("#buffer", () => {
    function testReserialization(filename: string) {
      const original = SimDataResource.fromXml(getBuffer(filename));
      original.uncache();
      const simdata = SimDataResource.from(original.buffer);
      expect(simdata.equals(original)).to.be.true;
    }

    it("should be the same as the buffer it was created with if no changes were made", () => {
      const buffer = getBuffer("buff.simdata");
      const simdata = SimDataResource.from(buffer);
      expect(simdata.buffer).to.equal(buffer);
    });

    it("should throw if the current model cannot be serialized", () => {
      const simdata = SimDataResource.create({
        instances: [
          new simDataFragments.SimDataInstance("", undefined, undefined)
        ]
      });

      expect(() => simdata.buffer).to.throw();
    });

    it("should reserialize all_data_types.xml correctly", () => {
      testReserialization("all_data_types.xml");
    });

    it("should reserialize buff.xml correctly", () => {
      testReserialization("buff.xml");
    });

    it("should reserialize mood.xml correctly", () => {
      testReserialization("mood.xml");
    });

    it("should reserialize trait.xml correctly", () => {
      testReserialization("trait.xml");
    });

    it("should reserialize two_instances.xml correctly", () => {
      testReserialization("two_instances.xml");
    });

    it("should reserialize variant_recursion.xml correctly", () => {
      testReserialization("variant_recursion.xml");
    });

    it("should reserialize vector_recursion.xml correctly", () => {
      testReserialization("vector_recursion.xml");
    });
  });

  describe("#hasChanged", () => {
    it("should be false after loading from a buffer", () => {
      const simdata = getSimDataFromBinary("buff");
      expect(simdata.hasChanged).to.be.false;
    });

    it("should be true after loading from xml", () => {
      const simdata = getSimDataFromXml("buff");
      expect(simdata.hasChanged).to.be.true;
    });

    it("should be true after creating", () => {
      const simdata = SimDataResource.create();
      expect(simdata.hasChanged).to.be.true;
    });

    it("should be false after getting buffer", () => {
      const simdata = getSimDataFromXml("buff");
      simdata.buffer;
      expect(simdata.hasChanged).to.be.false;
    });
  });

  describe("#instance", () => {
    it("should return the first child of the instances array", () => {
      // TODO:
    });

    it("should set the first child of the instances array", () => {
      // TODO:
    });

    it("should uncache the owner when set", () => {
      // TODO:
    });

    it("should mutate the first instance", () => {
      // TODO:
    });
  });

  describe("#instances", () => {
    it("should uncache the owner when pushed to", () => {
      // TODO:
    });

    it("should uncache the owner when spliced", () => {
      // TODO:
    });

    it("should uncache the owner when sorted", () => {
      // TODO:
    });

    it("should uncache the owner when child is set", () => {
      // TODO:
    });

    it("should uncache the owner when child is mutated", () => {
      // TODO:
    });

    it("should set the owner of a pushed child to this simdata", () => {
      // TODO:
    });

    it("should set the owner of a set child to this simdata", () => {
      // TODO:
    });
  });

  describe("#props", () => {
    it("should return an object containing the cells in the first instance", () => {
      const simdata = SimDataResource.from(getBuffer("buff.simdata"));
    });

    it("should mutate the first instance's cells", () => {
      // TODO:
    });
  });
  
  describe("#schema", () => {
    it("should return the first child of the schemas array", () => {
      // TODO:
    });

    it("should set the first child of the schemas array", () => {
      // TODO:
    });

    it("should uncache the owner when set", () => {
      // TODO:
    });

    it("should mutate the first instance", () => {
      // TODO:
    });
  });

  describe("#schemas", () => {
    it("should uncache the owner when pushed to", () => {
      // TODO:
    });

    it("should uncache the owner when spliced", () => {
      // TODO:
    });

    it("should uncache the owner when sorted", () => {
      // TODO:
    });

    it("should uncache the owner when child is set", () => {
      // TODO:
    });

    it("should uncache the owner when child is mutated", () => {
      // TODO:
    });

    it("should set the owner of a pushed child to this simdata", () => {
      // TODO:
    });

    it("should set the owner of a set child to this simdata", () => {
      // TODO:
    });
  });

  describe("#unused", () => {
    it("should uncache when set", () => {
      // TODO:
    });
  });

  describe("#variant", () => {
    it("should be 'DATA'", () => {
      // TODO:
    });
  });

  describe("#version", () => {
    it("should uncache when set", () => {
      // TODO:
    });
  });

  //#endregion Properties

  //#region Initialization

  describe("#clone()", () => {
    it("should copy all properties", () => {
      // TODO:
    });

    it("should not copy the owner", () => {
      // TODO:
    });

    it("should not mutate the original", () => {
      // TODO:
    });

    it("should not mutate the schemas of the original", () => {
      // TODO:
    });

    it("should not mutate the instances of the original", () => {
      // TODO:
    });

    it("should set self as owner of new schemas/instances", () => {
      // TODO:
    });
  });

  describe("static#create()", () => {
    it("should use all properties that are given", () => {
      // TODO:
    });

    it("should use a default version of 0x101", () => {
      // TODO:
    });

    it("should use a default unused value of 0", () => {
      // TODO:
    });

    it("should use an empty list as default for schemas", () => {
      // TODO:
    });

    it("should use an empty list as default for instances", () => {
      // TODO:
    });

    it("should set self as owner of new schemas/instances", () => {
      // TODO:
    });
  });

  describe("static#from()", () => {
    it("should read all_data_types.simdata correctly", () => {
      // TODO:
    });

    it("should read buff.simdata correctly", () => {
      // TODO:
    });

    it("should read mood.simdata correctly", () => {
      // TODO:
    });

    it("should read trait.simdata correctly", () => {
      // TODO:
    });

    it("should read two_instances.simdata correctly", () => {
      // TODO:
    });

    it("should read variant_recursion.simdata correctly", () => {
      // TODO:
    });

    it("should read vector_recursion.simdata correctly", () => {
      // TODO:
    });

    it("should set self as owner of new schemas/instances", () => {
      // TODO:
    });
  });

  describe("static#fromXml()", () => {
    it("should work with an XML declaration", () => {
      // TODO:
    });

    it("should work without an XML declaration", () => {
      // TODO:
    });

    it("should read all_data_types.xml correctly", () => {
      // TODO:
    });

    it("should read buff.xml correctly", () => {
      // TODO:
    });

    it("should read mood.xml correctly", () => {
      // TODO:
    });

    it("should read trait.xml correctly", () => {
      // TODO:
    });

    it("should read two_instances.xml correctly", () => {
      // TODO:
    });

    it("should read variant_recursion.xml correctly", () => {
      // TODO:
    });

    it("should read vector_recursion.xml correctly", () => {
      // TODO:
    });

    it("should set self as owner of new schemas/instances", () => {
      // TODO:
    });
  });

  describe("static#fromXmlDocument()", () => {
    // fromXml() uses this function for everything but parsing the string as an
    // XML document, so tests for it are tests for this
  });

  //#endregion Initialization

  //#region Methods

  describe("#equals()", () => {
    // TODO:
  });

  describe("#removeInstances()", () => {
    it("should remove the one instance that is given", () => {
      // TODO:
    });

    it("should remove the multiple instances that are given", () => {
      // TODO:
    });

    it("should not remove an identical instance that is not the same object", () => {
      // TODO:
    });

    it("should uncache the owner", () => {
      // TODO:
    });
  });

  describe("#removeSchemas()", () => {
    it("should remove the one schema that is given", () => {
      // TODO:
    });

    it("should remove the multiple schemas that are given", () => {
      // TODO:
    });

    it("should not remove an identical schema that is not the same object", () => {
      // TODO:
    });

    it("should uncache the owner", () => {
      // TODO:
    });
  });

  describe("#toXmlDocument()", () => {
    it("should have an XML declaration", () => {
      // TODO:
    });

    it("should have a 'SimData' tag with 'version' and 'u' attributes", () => {
      // TODO:
    });

    it("should have an 'Instances' section with all instances written correctly", () => {
      // TODO:
    });

    it("should have a 'Schemas' section with all schemas written correctly", () => {
      // TODO:
    });
  });

  describe("#uncache()", () => {
    it("should reset the buffer", () => {
      // TODO:
    });

    it("should uncache the owner", () => {
      // TODO:
    });
  });

  //#endregion Methods
});
