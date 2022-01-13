import { expect } from "chai";
import { simDataFragments, simDataTypes } from "../../../dst/api";
import MockOwner from "../../mocks/mockOwner";

const { SimDataSchema, SimDataSchemaColumn, SimDataInstance } = simDataFragments;
const { SimDataType } = simDataTypes;

const testSchema = new SimDataSchema("TestSchema", 0x1234, [
  new SimDataSchemaColumn("boolean", SimDataType.Boolean, 0),
  new SimDataSchemaColumn("uint32", SimDataType.UInt32, 0),
  new SimDataSchemaColumn("string", SimDataType.String, 0)
]);

describe("SimDataSchema", () => {
  function expectOwnerToUncache(fn: (schema: simDataFragments.SimDataSchema) => void) {
    const schema = testSchema.clone();
      const owner = new MockOwner();
      schema.owner = owner;
      expect(owner.cached).to.be.true;
      fn(schema);
      expect(owner.cached).to.be.false;
  }

  describe("#owner", () => {
    it("should update the owner of contained columns when set", () => {
      const schema = testSchema.clone();
      expect(schema.columns[0].owner).to.be.undefined;
      const owner = new MockOwner();
      schema.owner = owner;
      expect(schema.columns[0].owner).to.equal(owner);
    });
  });

  describe("#columns", () => {
    it("should uncache the owner when pushed to", () => {
      expectOwnerToUncache(schema => {
        schema.columns.push(new SimDataSchemaColumn("float3", SimDataType.Float3, 0));
      });
    });

    it("should uncache the owner when spliced", () => {
      expectOwnerToUncache(schema => {
        schema.columns.splice(0, 1);
      });
    });

    it("should uncache the owner when sorted", () => {
      expectOwnerToUncache(schema => {
        schema.columns.sort((a, b) => {
          if (a.name < b.name) return -1;
          if (b.name < a.name) return 1;
          return 0;
        });
      });
    });

    it("should uncache the owner when child is set", () => {
      expectOwnerToUncache(schema => {
        schema.columns[0] = new SimDataSchemaColumn("float3", SimDataType.Float3, 0);
      });
    });

    it("should uncache the owner when child is deleted", () => {
      expectOwnerToUncache(schema => {
        delete schema.columns[0];
      });
    });

    it("should uncache the owner when child is mutated", () => {
      expectOwnerToUncache(schema => {
        schema.columns[0].name = "some_better_name";
      });
    });

    it("should set the owner of a column that is set", () => {
      const schema = testSchema.clone();
      const owner = new MockOwner();
      schema.owner = owner;
      const column = new SimDataSchemaColumn("float3", SimDataType.Float3, 0);
      expect(column.owner).to.be.undefined;
      schema.columns[0] = column;
      expect(column.owner).to.equal(owner);
    });

    it("should set the owner of a column that is pushed", () => {
      const schema = testSchema.clone();
      const owner = new MockOwner();
      schema.owner = owner;
      const column = new SimDataSchemaColumn("float3", SimDataType.Float3, 0);
      expect(column.owner).to.be.undefined;
      schema.columns.push(column);
      expect(column.owner).to.equal(owner);
    });
  });

  describe("#hash", () => {
    it("should uncache the owner when set", () => {
      expectOwnerToUncache(schema => {
        schema.hash = 0;
      });
    });
  });

  describe("#name", () => {
    it("should uncache the owner when set", () => {
      expectOwnerToUncache(schema => {
        schema.name = "BetterName";
      });
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

  describe("#owner", () => {
    it("should update the owner of contained cells when set", () => {
      // TODO:
    });
  });

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
