import { expect } from "chai";
import { SimDataResource } from "../../../dst/api";

describe("SimDataResource", () => {
  //#region Properties

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
    // TODO:
  });

  describe("static#fromXml()", () => {
    // most tests are done in fromXmlDocument, since all this function does is
    // converts the xml string to a document and then calls that

    it("should work with an XML declaration", () => {
      // TODO:
    });

    it("should work without an XML declaration", () => {
      // TODO:
    });
  });

  describe("static#fromXmlDocument()", () => {
    // TODO:
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

  //#endregion Methods
});
