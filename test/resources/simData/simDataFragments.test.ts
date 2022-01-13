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
  describe("#flags", () => {
    it("should uncache the owner when set", () => {
      // TODO:
    });
  });

  describe("#name", () => {
    it("should uncache the owner when set", () => {
      // TODO:
    });
  });

  describe("#type", () => {
    it("should uncache the owner when set", () => {
      // TODO:
    });
  });

  describe("#constructor", () => {
    it("should use the given name, type, and flags", () => {
      // TODO:
    });

    it("should use the owner that is given", () => {
      // TODO:
    });

    it("should have an undefined owner if none is given", () => {
      // TODO:
    });
  });

  describe("#clone()", () => {
    it("should copy the name, type, and flags of this column", () => {
      // TODO:
    });

    it("should not copy the owner", () => {
      // TODO:
    });

    it("should not mutate the original", () => {
      // TODO:
    });
  });

  describe("#toXmlNode()", () => {
    it("should use the tag 'Column'", () => {
      // TODO:
    });

    it("should have 'name', 'type', and 'flags' attributes", () => {
      // TODO:
    });

    it("should write the type as its string value", () => {
      // TODO:
    });

    it("should write 'Single' for a type of 'Float'", () => {
      // TODO:
    });

    it("should write the flags as 32-bit with 0x prefix", () => {
      // TODO:
    });
  });

  describe("static#fromXmlNode()", () => {
    it("should throw if the tag != 'Column'", () => {
      // TODO:
    });

    it("should throw if there is no name", () => {
      // TODO:
    });

    it("should throw if there is no type", () => {
      // TODO:
    });

    it("should throw if there is no flags", () => {
      // TODO:
    });

    it("should parse flags as a number", () => {
      // TODO:
    });

    it("should have the name, type, and flags specified", () => {
      // TODO:
    });
  });
});

describe("SimDataInstance", () => {
  // most tests are done in ObjectCell, since instance is basically just an
  // ObjectCell with a name

  describe("#name", () => {
    it("should uncache the owner when set", () => {
      // TODO:
    });
  });

  describe("#clone", () => {
    it("should copy the name", () => {
      // TODO:
    });

    it("should not copy the owner", () => {
      // TODO:
    });

    it("should not mutate the original", () => {
      // TODO:
    });
  });

  describe("#toXmlNode()", () => {
    it("should use an 'I' tag", () => {
      // TODO:
    });

    it("should have an 'Object' type", () => {
      // TODO:
    });

    it("should have its schema name written", () => {
      // TODO:
    });

    it("should write its children with their names", () => {
      // TODO:
    });
  });

  describe("static#fromObjectCell()", () => {
    it("should not mutate the original object cell", () => {
      // TODO:
    });

    it("should create an instance with the given name", () => {
      // TODO:
    });

    it("should copy the owner", () => {
      // TODO:
    });

    it("should set the owner of its children", () => {
      // TODO:
    });
  });

  describe("static#fromXmlNode()", () => {
    it("should throw if the tag != 'I'", () => {
      // TODO:
    });

    it("should throw if there is no name", () => {
      // TODO:
    });

    it("should throw if there is no schema", () => {
      // TODO:
    });

    it("should throw if its schema was not provided", () => {
      // TODO:
    });

    it("should have the name and schema that are specified", () => {
      // TODO:
    });

    it("should contain the correct children", () => {
      // TODO:
    });
  });
});
