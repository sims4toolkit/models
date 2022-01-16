import fs from "fs";
import path from "path";
import { expect } from "chai";
import { SimDataResource } from "../../../dst/api";

const cachedBuffers: { [key: string]: Buffer; } = {};

function getBuffer(filename: string, type: "xml" | "simdata") {
  if (cachedBuffers[filename]) {
    return cachedBuffers[filename];
  } else {
    const folder = type === "xml" ? "xml" : "binary";
    const filepath = path.resolve(__dirname, `../../data/simdatas/${folder}/${filename}.${type}`);
    const buffer = fs.readFileSync(filepath);
    cachedBuffers[filename] = buffer;
    return buffer;
  }
}

describe("SimDataResource", () => {
  //#region Properties

  describe("#buffer", () => {
    it("should be the same as the buffer it was created with if no changes were made", () => {
      // TODO:
    });

    it("should throw if the current model cannot be serialized", () => {
      // TODO:
    });

    it("should reserialize all_data_types.simdata correctly", () => {
      // TODO:
    });

    it("should reserialize buff.simdata correctly", () => {
      // TODO:
    });

    it("should reserialize mood.simdata correctly", () => {
      // TODO:
    });

    it("should reserialize trait.simdata correctly", () => {
      // TODO:
    });

    it("should reserialize two_instances.simdata correctly", () => {
      // TODO:
    });

    it("should reserialize variant_recursion.simdata correctly", () => {
      // TODO:
    });

    it("should reserialize vector_recursion.simdata correctly", () => {
      // TODO:
    });
  });

  describe("#hasChanged", () => {
    it("should be false after loading from a buffer", () => {
      // TODO:
    });

    it("should be true after loading from xml", () => {
      // TODO:
    });

    it("should be true after creating", () => {
      // TODO:
    });

    it("should be true after constructing", () => {
      // TODO:
    });

    it("should be false after getting buffer", () => {
      // TODO:
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
      // TODO:
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

  describe("#constructor", () => {
    it("should use all properties that are given", () => {
      // TODO:
    });

    it("should set itself as the owner of all schemas and instances", () => {
      // TODO:
    });
  });

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
  });

  describe("static#fromXmlDocument()", () => {
    // fromXml() uses this function for everything but parsing the string as an
    // XML document, so tests for it are tests for this
  });

  //#endregion Initialization

  //#region Methods

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
