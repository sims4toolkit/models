import { expect } from "chai";
import { simDataFragments, simDataTypes } from "../../../dst/api";
import MockOwner from "../../mocks/mockOwner";

const { SimDataSchema, SimDataSchemaColumn, SimDataInstance } = simDataFragments;
const { SimDataType } = simDataTypes;

describe("SimDataSchema", () => {
  describe("#owner", () => {
    it("should update the owner of contained columns when set", () => {
      // TODO:
    });
  });

  describe("#columns", () => {
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

    it("should uncache the owner when child is deleted", () => {
      // TODO:
    });

    it("should uncache the owner when child is mutated", () => {
      // TODO:
    });

    it("should set the owner of a column that is set", () => {
      // TODO:
    });

    it("should set the owner of a column that is pushed", () => {
      // TODO:
    });
  });

  describe("#hash", () => {
    it("should uncache the owner when set", () => {
      // TODO:
    });
  });

  describe("#name", () => {
    it("should uncache the owner when set", () => {
      // TODO:
    });
  });

  describe("#constructor", () => {
    it("should use the given name, hash, and columns", () => {
      // TODO:
    });

    it("should have an empty array of columns if given undefined", () => {
      // TODO:
    });

    it("should use the owner that is given", () => {
      // TODO:
    });

    it("should have an undefined owner if none is given", () => {
      // TODO:
    });

    it("should pass on the owner that is given to its columns", () => {
      // TODO:
    });
  });

  describe("#addColumnClones()", () => {
    it("should add a copy of the given column to this schema", () => {
      // TODO:
    });

    it("should not mutate the original", () => {
      // TODO:
    });

    it("should set the owner of the new column", () => {
      // TODO:
    });

    it("should uncache the owner", () => {
      // TODO:
    });
  });

  describe("#clone()", () => {
    it("should copy the name, hash, and columns of this schema", () => {
      // TODO:
    });

    it("should not copy the owner", () => {
      // TODO:
    });

    it("should not mutate the original", () => {
      // TODO:
    });

    it("should not mutate the original's columns", () => {
      // TODO:
    });

    it("should not copy the column's owners", () => {
      // TODO:
    });
  });

  describe("#removeColumns()", () => {
    it("should remove the one exact column that is given", () => {
      // TODO:
    });

    it("should remove the multiple exact columns that is given", () => {
      // TODO:
    });

    it("should not remove an identical column if it is not the same object", () => {
      // TODO:
    });
  });

  describe("#toXmlNode()", () => {
    it("should use the tag 'Schema'", () => {
      // TODO:
    });

    it("should have 'name' and 'schema_hash' attributes", () => {
      // TODO:
    });

    it("should write the schema hash as 32-bit with 0x prefix", () => {
      // TODO:
    });

    it("should contain one child with the tag 'Columns' that contains one child for each of its columns", () => {
      // TODO:
    });
  });

  describe("static#fromXmlNode()", () => {
    it("should throw if the tag != 'Schema'", () => {
      // TODO:
    });

    it("should throw if there is no name", () => {
      // TODO:
    });

    it("should throw if there is no schema hash", () => {
      // TODO:
    });

    it("should throw if there are no columns", () => {
      // TODO:
    });

    it("should parse schema hash as a number", () => {
      // TODO:
    });

    it("should have the name, hash, and children specified", () => {
      // TODO:
    });
  });
});

describe("SimDataSchemaColumn", () => {
  describe("#owner", () => {
    // TODO:
  });

  describe("#flags", () => {
    // TODO:
  });

  describe("#name", () => {
    // TODO:
  });

  describe("#type", () => {
    // TODO:
  });

  describe("#clone()", () => {
    // TODO:
  });

  describe("#removeColumns()", () => {
    // TODO:
  });

  describe("static#fromXmlNode()", () => {
    // TODO:
  });
});

describe("SimDataInstance", () => {
  describe("#owner", () => {
    // TODO:
  });

  describe("#name", () => {
    // TODO:
  });

  describe("#clone", () => {
    // TODO:
  });

  describe("#toXmlNode()", () => {
    // TODO:
  });

  describe("static#fromObjectCell()", () => {
    // TODO:
  });

  describe("static#fromXmlNode()", () => {
    // TODO:
  });
});
