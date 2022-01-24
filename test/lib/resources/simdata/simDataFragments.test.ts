import { XmlDocumentNode } from "@s4tk/xml-dom";
import { expect } from "chai";
import { simDataFragments, simDataTypes, simDataCells } from "../../../../dst/models";
import MockOwner from "../../../mocks/mock-owner";

const { SimDataSchema, SimDataSchemaColumn, SimDataInstance } = simDataFragments;
const { SimDataType } = simDataTypes;
const cells = simDataCells;

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

    it("should use the new owner for new children after updating the owner", () => {
      const schema = testSchema.clone();
      const owner = new MockOwner();
      schema.owner = owner;
      const column = new SimDataSchemaColumn("name", 0, 0);
      expect(column.owner).to.be.undefined;
      schema.columns.push(column);
      expect(column.owner).to.equal(owner);
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
      const schema = new SimDataSchema("TestSchema", 0x1234, [
        new SimDataSchemaColumn("boolean", SimDataType.Boolean, 0),
        new SimDataSchemaColumn("uint32", SimDataType.UInt32, 0)
      ]);

      expect(schema.name).to.equal("TestSchema");
      expect(schema.hash).to.equal(0x1234);
      expect(schema.columns).to.have.lengthOf(2);
      expect(schema.columns[0].name).to.equal("boolean");
      expect(schema.columns[1].name).to.equal("uint32");
    });

    it("should have an empty array of columns if given undefined", () => {
      const schema = new SimDataSchema("TestSchema", 0x1234, undefined);
      expect(schema.columns).to.be.an('Array').that.is.empty;
    });

    it("should use the owner that is given", () => {
      const owner = new MockOwner();
      const schema = new SimDataSchema("TestSchema", 0x1234, undefined, owner);
      expect(schema.owner).to.equal(owner);
    });

    it("should have an undefined owner if none is given", () => {
      const schema = new SimDataSchema("TestSchema", 0x1234, undefined);
      expect(schema.owner).to.be.undefined;
    });

    it("should pass on the owner that is given to its columns", () => {
      const owner = new MockOwner();
      const schema = new SimDataSchema("TestSchema", 0x1234, [
        new SimDataSchemaColumn("boolean", SimDataType.Boolean, 0)
      ], owner);
      expect(schema.columns[0].owner).to.equal(owner);
    });
  });

  describe("#addColumnClones()", () => {
    it("should add a copy of the given column to this schema", () => {
      const column = new SimDataSchemaColumn("column", SimDataType.Int16, 0);
      const schema = new SimDataSchema("NewSchema", 1, []);
      schema.addColumnClones(column);
      expect(schema.columns).to.have.lengthOf(1);
      expect(schema.columns[0]).to.not.equal(column);
    });

    it("should add a copy of the given columns to this schema", () => {
      const column1 = new SimDataSchemaColumn("column1", SimDataType.Int16, 0);
      const column2 = new SimDataSchemaColumn("column2", SimDataType.Int16, 0);
      const schema = new SimDataSchema("NewSchema", 1, []);
      schema.addColumnClones(column1, column2);
      expect(schema.columns).to.have.lengthOf(2);
      expect(schema.columns[0]).to.not.equal(column1);
      expect(schema.columns[1]).to.not.equal(column2);
    });

    it("should not mutate the original", () => {
      const column = new SimDataSchemaColumn("column", SimDataType.Int16, 0);
      const schema = new SimDataSchema("NewSchema", 1, []);
      schema.addColumnClones(column);
      schema.columns[0].name = "new_column";
      expect(column.name).to.equal("column");
    });

    it("should set the owner of the new column", () => {
      const owner = new MockOwner();
      const schema = new SimDataSchema("NewSchema", 0x1, [], owner);
      const column = new SimDataSchemaColumn("column", SimDataType.Int16, 0);
      schema.addColumnClones(column);
      expect(schema.columns[0].owner).to.equal(owner);
    });

    it("should not set the owner of the original column", () => {
      const owner = new MockOwner();
      const schema = new SimDataSchema("NewSchema", 0x1, [], owner);
      const column = new SimDataSchemaColumn("column", SimDataType.Int16, 0);
      schema.addColumnClones(column);
      expect(column.owner).to.be.undefined;
    });

    it("should uncache the owner", () => {
      const owner = new MockOwner();
      const schema = new SimDataSchema("NewSchema", 0x1, [], owner);
      const column = new SimDataSchemaColumn("column", SimDataType.Int16, 0);
      expect(owner.cached).to.be.true;
      schema.addColumnClones(column);
      expect(owner.cached).to.be.false;
    });
  });

  describe("#clone()", () => {
    it("should copy the name, hash, and columns of this schema", () => {
      const clone = testSchema.clone();
      expect(clone.name).to.equal("TestSchema");
      expect(clone.hash).to.equal(0x1234);
      expect(clone.columns).to.have.lengthOf(3);
      expect(clone.columns[0].name).to.equal("boolean");
      expect(clone.columns[1].name).to.equal("uint32");
      expect(clone.columns[2].name).to.equal("string");
    });

    it("should not copy the owner", () => {
      const owner = new MockOwner();
      const schema = new SimDataSchema("NewSchema", 0x1, [], owner);
      const clone = schema.clone();
      expect(clone.owner).to.be.undefined;
    });

    it("should not mutate the original", () => {
      const schema = new SimDataSchema("NewSchema", 0x1, []);
      const clone = schema.clone();
      clone.name = "NewerSchema";
      expect(schema.name).to.equal("NewSchema");
    });

    it("should not mutate the original's columns", () => {
      const clone = testSchema.clone();
      expect(testSchema.columns).to.have.lengthOf(3);
      expect(clone.columns).to.have.lengthOf(3);
      clone.columns.splice(0, 1);
      expect(testSchema.columns).to.have.lengthOf(3);
      expect(clone.columns).to.have.lengthOf(2);
    });

    it("should not copy the column's owners", () => {
      const owner = new MockOwner();
      const schema = new SimDataSchema("NewSchema", 0x1, [
        new SimDataSchemaColumn("column", SimDataType.Int16, 0)
      ], owner);
      expect(schema.columns[0].owner).to.equal(owner);
      const clone = schema.clone();
      expect(clone.columns[0].owner).to.be.undefined;
    });
  });

  describe("#equals()", () => {
    it("should return true if the schemas are the same", () => {
      const schema = testSchema.clone();
      const other = schema.clone();
      expect(schema.equals(other)).to.be.true;
    });

    it("should return false if the name is different", () => {
      const schema = testSchema.clone();
      const other = schema.clone();
      other.name = "NewName";
      expect(schema.equals(other)).to.be.false;
    });

    it("should return false if the hash is different", () => {
      const schema = testSchema.clone();
      const other = schema.clone();
      other.hash = 123;
      expect(schema.equals(other)).to.be.false;
    });

    it("should return false if the columns are different", () => {
      const schema = testSchema.clone();
      const other = schema.clone();
      other.columns.push(other.columns[0]);
      expect(schema.equals(other)).to.be.false;
    });
  });

  describe("#removeColumns()", () => {
    it("should remove the one exact column that is given", () => {
      const schema = testSchema.clone();
      const columnToRemove = schema.columns[0];
      expect(schema.columns).to.have.lengthOf(3);
      expect(schema.columns[0].name).to.equal("boolean");
      expect(schema.columns[1].name).to.equal("uint32");
      expect(schema.columns[2].name).to.equal("string");
      schema.removeColumns(columnToRemove);
      expect(schema.columns).to.have.lengthOf(2);
      expect(schema.columns[0].name).to.equal("uint32");
      expect(schema.columns[1].name).to.equal("string");
    });

    it("should uncache the owner", () => {
      expectOwnerToUncache(schema => {
        const columnToRemove = schema.columns[0];
        schema.removeColumns(columnToRemove);
      });
    });

    it("should remove the multiple exact columns that are given", () => {
      const schema = testSchema.clone();
      const firstColumn = schema.columns[0];
      const thirdColumn = schema.columns[2];
      expect(schema.columns).to.have.lengthOf(3);
      expect(schema.columns[0].name).to.equal("boolean");
      expect(schema.columns[1].name).to.equal("uint32");
      expect(schema.columns[2].name).to.equal("string");
      schema.removeColumns(firstColumn, thirdColumn);
      expect(schema.columns).to.have.lengthOf(1);
      expect(schema.columns[0].name).to.equal("uint32");
    });

    it("should not remove an identical column if it is not the same object", () => {
      const schema = testSchema.clone();
      const columnToRemove = schema.columns[0].clone();
      expect(schema.columns).to.have.lengthOf(3);
      schema.removeColumns(columnToRemove);
      expect(schema.columns).to.have.lengthOf(3);
    });
  });

  describe("#toXmlNode()", () => {
    const node = testSchema.toXmlNode();

    it("should use the tag 'Schema'", () => {
      expect(node.tag).to.equal("Schema");
    });

    it("should have 'name' and 'schema_hash' attributes", () => {
      expect(node.attributes.name).to.equal("TestSchema");
      expect(node.attributes.schema_hash).to.equal("0x00001234");
    });

    it("should contain one child with the tag 'Columns' that contains one child for each of its columns", () => {
      expect(node.numChildren).to.equal(1);
      expect(node.child.tag).to.equal("Columns");
      expect(node.child.numChildren).to.equal(3);
    });
  });

  describe("static#fromXmlNode()", () => {
    it("should throw if the tag != 'Schema'", () => {
      const node = XmlDocumentNode.from(`<S name="TestSchema" schema_hash="0x00001234">
        <Columns>
          <Column name="boolean" type="Boolean" flags="0x00000000" />
          <Column name="float" type="Single" flags="0x00000000" />
          <Column name="string" type="String" flags="0x00000000" />
        </Columns>
      </S>`).child;

      expect(() => SimDataSchema.fromXmlNode(node)).to.throw();
    });

    it("should throw if there is no name", () => {
      const node = XmlDocumentNode.from(`<Schema schema_hash="0x00001234">
        <Columns>
          <Column name="boolean" type="Boolean" flags="0x00000000" />
          <Column name="float" type="Single" flags="0x00000000" />
          <Column name="string" type="String" flags="0x00000000" />
        </Columns>
      </Schema>`).child;

      expect(() => SimDataSchema.fromXmlNode(node)).to.throw();
    });

    it("should throw if there is no schema hash", () => {
      const node = XmlDocumentNode.from(`<Schema name="TestSchema">
        <Columns>
          <Column name="boolean" type="Boolean" flags="0x00000000" />
          <Column name="float" type="Single" flags="0x00000000" />
          <Column name="string" type="String" flags="0x00000000" />
        </Columns>
      </Schema>`).child;

      expect(() => SimDataSchema.fromXmlNode(node)).to.throw();
    });

    it("should throw if there are no columns", () => {
      const node = XmlDocumentNode.from(`<Schema name="TestSchema" schema_hash="0x00001234">
      </Schema>`).child;

      expect(() => SimDataSchema.fromXmlNode(node)).to.throw();
    });

    it("should have the name, hash, and children specified", () => {
      const node = XmlDocumentNode.from(`<Schema name="TestSchema" schema_hash="0x00001234">
        <Columns>
          <Column name="boolean" type="Boolean" flags="0x00000000" />
          <Column name="float" type="Single" flags="0x00000000" />
          <Column name="string" type="String" flags="0x00000000" />
        </Columns>
      </Schema>`).child;

      const schema = SimDataSchema.fromXmlNode(node);
      expect(schema.name).to.equal("TestSchema");
      expect(schema.hash).to.equal(0x1234);
      expect(schema.columns).to.have.lengthOf(3);
      const [ col1, col2, col3 ] = schema.columns;
      expect(col1.name).to.equal("boolean");
      expect(col1.type).to.equal(SimDataType.Boolean);
      expect(col2.name).to.equal("float");
      expect(col2.type).to.equal(SimDataType.Float);
      expect(col3.name).to.equal("string");
      expect(col3.type).to.equal(SimDataType.String);
    });
  });
});

describe("SimDataSchemaColumn", () => {
  function expectOwnerToUncache(fn: (column: simDataFragments.SimDataSchemaColumn) => void) {
    const owner = new MockOwner();
    const column = new SimDataSchemaColumn("boolean", SimDataType.Boolean, 0, owner);
    expect(owner.cached).to.be.true;
    fn(column);
    expect(owner.cached).to.be.false;
  }

  describe("#flags", () => {
    it("should uncache the owner when set", () => {
      expectOwnerToUncache(column => {
        column.flags += 1;
      });
    });
  });

  describe("#name", () => {
    it("should uncache the owner when set", () => {
      expectOwnerToUncache(column => {
        column.name = "new_names";
      });
    });
  });

  describe("#type", () => {
    it("should uncache the owner when set", () => {
      expectOwnerToUncache(column => {
        column.type = SimDataType.String;
      });
    });
  });

  describe("#constructor", () => {
    it("should use the given name, type, and flags", () => {
      const column = new SimDataSchemaColumn("boolean", SimDataType.Boolean, 0x1234);
      expect(column.name).to.equal("boolean");
      expect(column.type).to.equal(SimDataType.Boolean);
      expect(column.flags).to.equal(0x1234);
    });

    it("should use the owner that is given", () => {
      const owner = new MockOwner();
      const column = new SimDataSchemaColumn("boolean", SimDataType.Boolean, 0, owner);
      expect(column.owner).to.equal(owner);
    });

    it("should have an undefined owner if none is given", () => {
      const column = new SimDataSchemaColumn("boolean", SimDataType.Boolean, 0);
      expect(column.owner).to.be.undefined;
    });
  });

  describe("#clone()", () => {
    it("should copy the name, type, and flags of this column", () => {
      const column = new SimDataSchemaColumn("boolean", SimDataType.Boolean, 0x1234);
      const clone = column.clone();
      expect(clone.name).to.equal("boolean");
      expect(clone.type).to.equal(SimDataType.Boolean);
      expect(clone.flags).to.equal(0x1234);
    });

    it("should not copy the owner", () => {
      const owner = new MockOwner();
      const column = new SimDataSchemaColumn("boolean", SimDataType.Boolean, 0x1234, owner);
      const clone = column.clone();
      expect(clone.owner).to.be.undefined;
    });

    it("should not mutate the original", () => {
      const column = new SimDataSchemaColumn("boolean", SimDataType.Boolean, 0x1234);
      const clone = column.clone();
      clone.name = "new_name";
      expect(column.name).to.equal("boolean");
    });
  });

  describe("#equals()", () => {
    it("should return true if the columns are the same", () => {
      const column = new SimDataSchemaColumn("boolean", SimDataType.Boolean, 0x1234);
      const other = column.clone();
      expect(column.equals(other)).to.be.true;
    });

    it("should return false if the name is different", () => {
      const column = new SimDataSchemaColumn("boolean", SimDataType.Boolean, 0x1234);
      const other = column.clone();
      other.name = "new_name";
      expect(column.equals(other)).to.be.false;
    });

    it("should return false if the type is different", () => {
      const column = new SimDataSchemaColumn("boolean", SimDataType.Boolean, 0x1234);
      const other = column.clone();
      other.type = SimDataType.Vector;
      expect(column.equals(other)).to.be.false;
    });

    it("should return false if the flags are different", () => {
      const column = new SimDataSchemaColumn("boolean", SimDataType.Boolean, 0x1234);
      const other = column.clone();
      other.flags = 0;
      expect(column.equals(other)).to.be.false;
    });
  });

  describe("#toXmlNode()", () => {
    it("should use the tag 'Column'", () => {
      const column = new SimDataSchemaColumn("boolean", SimDataType.Boolean, 0x1234);
      const node = column.toXmlNode();
      expect(node.tag).to.equal("Column");
    });

    it("should have 'name', 'type', and 'flags' attributes", () => {
      const column = new SimDataSchemaColumn("boolean", SimDataType.Boolean, 0x1234);
      const node = column.toXmlNode();
      expect(node.attributes.name).to.equal("boolean");
      expect(node.attributes.type).to.equal("Boolean");
      expect(node.attributes.flags).to.equal("0x00001234");
    });

    it("should write 'Single' for a type of 'Float'", () => {
      const column = new SimDataSchemaColumn("float", SimDataType.Float, 0);
      const node = column.toXmlNode();
      expect(node.attributes.type).to.equal("Single");
    });
  });

  describe("static#fromXmlNode()", () => {
    it("should throw if the tag != 'Column'", () => {
      const node = XmlDocumentNode.from(`<C name="boolean" type="Boolean" flags="0x00001234" />`).child;
      expect(() => SimDataSchemaColumn.fromXmlNode(node)).to.throw();
    });

    it("should throw if there is no name", () => {
      const node = XmlDocumentNode.from(`<Column type="Boolean" flags="0x00001234" />`).child;
      expect(() => SimDataSchemaColumn.fromXmlNode(node)).to.throw();
    });

    it("should throw if there is no type", () => {
      const node = XmlDocumentNode.from(`<Column name="boolean" flags="0x00001234" />`).child;
      expect(() => SimDataSchemaColumn.fromXmlNode(node)).to.throw();
    });

    it("should throw if there is no flags", () => {
      const node = XmlDocumentNode.from(`<Column name="boolean" type="Boolean" />`).child;
      expect(() => SimDataSchemaColumn.fromXmlNode(node)).to.throw();
    });

    it("should have the name, type, and flags specified", () => {
      const node = XmlDocumentNode.from(`<Column name="boolean" type="Boolean" flags="0x00001234" />`).child;
      const column = SimDataSchemaColumn.fromXmlNode(node);
      expect(column.name).to.equal("boolean");
      expect(column.type).to.equal(SimDataType.Boolean);
      expect(column.flags).to.equal(0x00001234);
    });
  });
});

describe("SimDataInstance", () => {
  // most tests are done in ObjectCell, since instance is basically just an
  // ObjectCell with a name

  describe("#owner", () => {
    it("should update the owner of contained cells when set", () => {
      const firstOwner = new MockOwner();
      const boolean = new cells.BooleanCell(true);
      const string = new cells.TextCell(SimDataType.String, "Hi");
      const cell = new SimDataInstance("InstanceName", testSchema, {
        boolean,
        string
      }, firstOwner);
      const secondOwner = new MockOwner();
      cell.owner = secondOwner;
      expect(boolean.owner).to.equal(secondOwner);
      expect(string.owner).to.equal(secondOwner);
    });

    it("should use the new owner for new children after updating the owner", () => {
      const owner = new MockOwner();
      const inst = new SimDataInstance("InstanceName", testSchema, {}, owner);
      const newOwner = new MockOwner();
      inst.owner = newOwner;
      const child = new cells.BooleanCell(true);
      inst.row.boolean = child;
      expect(child.owner).to.equal(newOwner);
    });
  });

  describe("#name", () => {
    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const inst = new SimDataInstance("InstanceName", testSchema, {}, owner);
      expect(owner.cached).to.be.true;
      inst.name = "NewName";
      expect(owner.cached).to.be.false;
    });
  });

  describe("#clone", () => {
    it("should copy the name", () => {
      const inst = new SimDataInstance("InstanceName", testSchema, {});
      const clone = inst.clone();
      expect(clone.name).to.equal("InstanceName");
    });

    it("should not copy the owner", () => {
      const owner = new MockOwner();
      const inst = new SimDataInstance("InstanceName", testSchema, {}, owner);
      const clone = inst.clone();
      expect(clone.owner).to.be.undefined;
    });

    it("should not mutate the original", () => {
      const inst = new SimDataInstance("InstanceName", testSchema, {});
      const clone = inst.clone();
      clone.name = "NewName";
      expect(inst.name).to.equal("InstanceName");
    });
  });

  describe("#equals()", () => {
    it("should return true if the instances are the same", () => {
      const inst = new SimDataInstance("InstanceName", testSchema, {});
      expect(inst.equals(inst.clone())).to.be.true;
    });

    it("should return false if the name is different", () => {
      const inst = new SimDataInstance("InstanceName", testSchema, {});
      const other = inst.clone();
      other.name = "NewName";
      expect(inst.equals(other)).to.be.false;
    });

    // other test cases covered by object cell
  });

  describe("#toXmlNode()", () => {
    it("should use an 'I' tag", () => {
      const inst = new SimDataInstance("InstanceName", testSchema, {
        boolean: new cells.BooleanCell(true),
        uint32: new cells.NumberCell(SimDataType.UInt32, 64),
        string: new cells.TextCell(SimDataType.String, "hi")
      });
      const node = inst.toXmlNode();
      expect(node.tag).to.equal("I");
    });

    it("should have an 'Object' type", () => {
      const inst = new SimDataInstance("InstanceName", testSchema, {
        boolean: new cells.BooleanCell(true),
        uint32: new cells.NumberCell(SimDataType.UInt32, 64),
        string: new cells.TextCell(SimDataType.String, "hi")
      });
      const node = inst.toXmlNode();
      expect(node.attributes.type).to.equal("Object");
    });

    it("should have its schema name written", () => {
      const inst = new SimDataInstance("InstanceName", testSchema, {
        boolean: new cells.BooleanCell(true),
        uint32: new cells.NumberCell(SimDataType.UInt32, 64),
        string: new cells.TextCell(SimDataType.String, "hi")
      });
      const node = inst.toXmlNode();
      expect(node.attributes.schema).to.equal("TestSchema");
    });

    it("should write its children with their names", () => {
      const inst = new SimDataInstance("InstanceName", testSchema, {
        boolean: new cells.BooleanCell(true),
        uint32: new cells.NumberCell(SimDataType.UInt32, 64),
        string: new cells.TextCell(SimDataType.String, "hi")
      });
      const node = inst.toXmlNode();
      expect(node.numChildren).to.equal(3);
      const [ child1, child2, child3 ] = node.children;
      expect(child1.attributes.name).to.equal("boolean");
      expect(child2.attributes.name).to.equal("uint32");
      expect(child3.attributes.name).to.equal("string");
    });
  });

  describe("static#fromObjectCell()", () => {
    it("should mutate the original object cell", () => {
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true),
        string: new cells.TextCell(SimDataType.String, "Hi")
      });

      const inst = SimDataInstance.fromObjectCell("InstanceName", cell);
      inst.row.string.asAny.value = "Hello";
      expect(cell.row.string.asAny.value).to.equal("Hello");
    });

    it("should create an instance with the given name", () => {
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true),
        string: new cells.TextCell(SimDataType.String, "Hi")
      });

      const inst = SimDataInstance.fromObjectCell("InstanceName", cell);
      expect(inst.name).to.equal("InstanceName");
    });

    it("should copy the owner", () => {
      const owner = new MockOwner();
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true),
        string: new cells.TextCell(SimDataType.String, "Hi")
      }, owner);

      const inst = SimDataInstance.fromObjectCell("InstanceName", cell);
      expect(inst.owner).to.equal(owner);
    });
  });

  describe("static#fromXmlNode()", () => {
    it("should throw if the tag != 'I'", () => {
      const node = XmlDocumentNode.from(`<Inst name="InstanceName" schema="TestSchema" type="Object">
        <T name="boolean">1</T>
        <T name="uint32">64</T>
        <T name="string">hi</T>
      </Inst>`).child;

      expect(() => SimDataInstance.fromXmlNode(node, [testSchema])).to.throw();
    });

    it("should throw if there is no name", () => {
      const node = XmlDocumentNode.from(`<I schema="TestSchema" type="Object">
        <T name="boolean">1</T>
        <T name="uint32">64</T>
        <T name="string">hi</T>
      </I>`).child;

      expect(() => SimDataInstance.fromXmlNode(node, [testSchema])).to.throw();
    });

    it("should throw if there is no schema", () => {
      const node = XmlDocumentNode.from(`<I name="InstanceName" type="Object">
        <T name="boolean">1</T>
        <T name="uint32">64</T>
        <T name="string">hi</T>
      </I>`).child;
      
      expect(() => SimDataInstance.fromXmlNode(node, [testSchema])).to.throw();
    });

    it("should throw if its schema was not provided", () => {
      const node = XmlDocumentNode.from(`<I name="InstanceName" schema="TestSchema" type="Object">
        <T name="boolean">1</T>
        <T name="uint32">64</T>
        <T name="string">hi</T>
      </I>`).child;

      expect(() => SimDataInstance.fromXmlNode(node, [])).to.throw();
    });

    it("should have the name and schema that are specified", () => {
      const node = XmlDocumentNode.from(`<I name="InstanceName" schema="TestSchema" type="Object">
        <T name="boolean">1</T>
        <T name="uint32">64</T>
        <T name="string">hi</T>
      </I>`).child;

      const inst = SimDataInstance.fromXmlNode(node, [testSchema]);
      expect(inst.name).to.equal("InstanceName");
      expect(inst.schema).to.equal(testSchema);
    });

    it("should contain the correct children", () => {
      const node = XmlDocumentNode.from(`<I name="InstanceName" schema="TestSchema" type="Object">
        <T name="boolean">1</T>
        <T name="uint32">64</T>
        <T name="string">hi</T>
      </I>`).child;

      const inst = SimDataInstance.fromXmlNode(node, [testSchema]);
      expect(inst.rowLength).to.equal(3);
      expect(inst.row.boolean.asAny.value).to.equal(true);
      expect(inst.row.boolean.dataType).to.equal(SimDataType.Boolean);
      expect(inst.row.uint32.asAny.value).to.equal(64);
      expect(inst.row.uint32.dataType).to.equal(SimDataType.UInt32);
      expect(inst.row.string.asAny.value).to.equal("hi");
      expect(inst.row.string.dataType).to.equal(SimDataType.String);
    });
  });
});
