import { expect } from "chai";
import { simDataCells, simDataFragments, simDataTypes } from "../../../../dst/api";
import { XmlElementNode, XmlValueNode } from "../../../../dst/lib/models/xml/dom";
import { BinaryEncoder } from "../../../../dst/lib/utils/encoding";
import MockOwner from "../../../mocks/mockOwner";

const cells = simDataCells;
const { SimDataSchema, SimDataSchemaColumn } = simDataFragments;
const { SimDataType } = simDataTypes;

//#region Helpers

const testSchema = new SimDataSchema("TestSchema", 0x1234, [
  new SimDataSchemaColumn("boolean", SimDataType.Boolean, 0),
  new SimDataSchemaColumn("uint32", SimDataType.UInt32, 0),
  new SimDataSchemaColumn("string", SimDataType.String, 0)
]);

const nestedObjectSchema = new SimDataSchema("NestedObject", 0x12, [
  new SimDataSchemaColumn("obj", SimDataType.Object, 0)
]);

function newValidObjectCell(): simDataCells.ObjectCell {
  return new cells.ObjectCell(testSchema, {
    boolean: new cells.BooleanCell(true),
    uint32: new cells.NumberCell(SimDataType.UInt32, 15),
    string: new cells.TextCell(SimDataType.String, "Hi")
  });
}

//#endregion Helpers

//#region Tests

describe("ObjectCell", () => {
  describe("#owner", () => {
    it("should update the owner of all children when set", () => {
      const firstOwner = new MockOwner();
      const boolean = new cells.BooleanCell(true);
      const string = new cells.TextCell(SimDataType.String, "Hi");
      const cell = new cells.ObjectCell(testSchema, {
        boolean,
        string
      }, firstOwner);
      const secondOwner = new MockOwner();
      cell.owner = secondOwner;
      expect(boolean.owner).to.equal(secondOwner);
      expect(string.owner).to.equal(secondOwner);
    });
  });

  describe("#row", () => {
    it("should uncache the owner when a child is added", () => {
      const owner = new MockOwner();
      const cell = new cells.ObjectCell(testSchema, {}, owner);
      expect(owner.cached).to.be.true;
      cell.row.boolean = new cells.BooleanCell(true);
      expect(owner.cached).to.be.false;
    });

    it("should set the owner of a child that is added", () => {
      const owner = new MockOwner();
      const cell = new cells.ObjectCell(testSchema, {}, owner);
      const child = new cells.BooleanCell(true);
      expect(child.owner).to.be.undefined;
      cell.row.boolean = child;
      expect(child.owner).to.equal(owner);
    });

    it("should uncache the owner when a child is deleted", () => {
      const owner = new MockOwner();
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true)
      }, owner);
      expect(owner.cached).to.be.true;
      delete cell.row.boolean;
      expect(owner.cached).to.be.false;
    });

    it("should delete a child when the delete operator is used", () => {
      const owner = new MockOwner();
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true)
      }, owner);
      expect(cell.row.boolean).to.not.be.undefined;
      delete cell.row.boolean;
      expect(cell.row.boolean).to.be.undefined;
    });

    it("should uncache the owner when a child is mutated", () => {
      const owner = new MockOwner();
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true)
      }, owner);
      expect(owner.cached).to.be.true;
      (cell.row.boolean as simDataCells.BooleanCell).value = false
      expect(owner.cached).to.be.false;
    });

    it("should uncache the owner when a child is set", () => {
      const owner = new MockOwner();
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true)
      }, owner);
      expect(owner.cached).to.be.true;
      cell.row.boolean = new cells.BooleanCell(false);
      expect(owner.cached).to.be.false;
    });

    it("should uncache the owner when a child is set to undefined", () => {
      const owner = new MockOwner();
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true)
      }, owner);
      expect(owner.cached).to.be.true;
      cell.row.boolean = undefined;
      expect(owner.cached).to.be.false;
    });

    it("should uncache the owner when a child is set to null", () => {
      const owner = new MockOwner();
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true)
      }, owner);
      expect(owner.cached).to.be.true;
      cell.row.boolean = null;
      expect(owner.cached).to.be.false;
    });

    it("should set the owner of a child that is set", () => {
      const owner = new MockOwner();
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true)
      }, owner);
      const newChild = new cells.BooleanCell(false);
      expect(newChild.owner).to.be.undefined;
      cell.row.boolean = newChild;
      expect(newChild.owner).to.equal(owner);
    });

    it("should not uncache the owner when a child is retrieved", () => {
      const owner = new MockOwner();
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true)
      }, owner);
      expect(owner.cached).to.be.true;
      const child = cell.row.boolean;
      expect(owner.cached).to.be.true;
    });
  });

  describe("#rowLength", () => {
    it("should return the number of children in this object", () => {
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true)
      });
      expect(cell.rowLength).to.equal(1);
    });

    it("should return the correct number after adding a child", () => {
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true)
      });
      cell.row.string = new cells.TextCell(SimDataType.String, "Hi");
      expect(cell.rowLength).to.equal(2);
    });

    it("should return the correct number after deleting a child", () => {
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true)
      });
      delete cell.row.boolean;
      expect(cell.rowLength).to.equal(0);
    });
  });

  describe("#schemaLength", () => {
    it("should return the number of columns in this object's schema", () => {
      const cell = new cells.ObjectCell(testSchema, {});
      expect(cell.schemaLength).to.equal(3);
    });
  });

  describe("#constructor", () => {
    it("should create a new object with the exact given schema", () => {
      const cell = new cells.ObjectCell(testSchema, {});
      expect(cell.schema).to.equal(testSchema);
    });

    it("should set the owner of all given children", () => {
      const owner = new MockOwner()
      const boolean = new cells.BooleanCell(true);
      const string = new cells.TextCell(SimDataType.String, "Hi");
      const cell = new cells.ObjectCell(testSchema, {
        boolean,
        string
      }, owner);
      expect(boolean.owner).to.equal(owner);
      expect(string.owner).to.equal(owner);
    });

    it("should contain the given children", () => {
      const boolean = new cells.BooleanCell(true);
      const string = new cells.TextCell(SimDataType.String, "Hi");
      const cell = new cells.ObjectCell(testSchema, {
        boolean,
        string
      });
      expect(cell.row.boolean).to.equal(boolean);
      expect(cell.row.string).to.equal(string);
    });

    it("should use the owner that is given", () => {
      const owner = new MockOwner();
      const cell = new cells.ObjectCell(testSchema, {}, owner);
      expect(cell.owner).to.equal(owner);
    });

    it("should not have an owner if one isn't given", () => {
      const cell = new cells.ObjectCell(testSchema, {});
      expect(cell.owner).to.be.undefined;
    });
  });

  describe("#clone()", () => {
    it("should create a new cell with cloned child cells", () => {
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true)
      });
      const clone = cell.clone();
      expect(clone.rowLength).to.equal(1);
      expect(clone.row.boolean.dataType).to.equal(SimDataType.Boolean);
      expect(clone.row.boolean.asAny.value).to.be.true;
    });

    it("should not mutate the original", () => {
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true)
      });
      const clone = cell.clone();
      clone.row.string = new cells.TextCell(SimDataType.String, "");
      expect(clone.rowLength).to.equal(2);
      expect(cell.rowLength).to.equal(1);
    });

    it("should not mutate the original children", () => {
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true)
      });
      const clone = cell.clone();
      clone.row.boolean.asAny.value = false;
      expect(clone.row.boolean.asAny.value).to.be.false;
      expect(cell.row.boolean.asAny.value).to.be.true;
    });

    it("should not clone the owner", () => {
      const owner = new MockOwner();
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true)
      }, owner);
      const clone = cell.clone();
      expect(clone.owner).to.be.undefined;
    });

    it("should not clone the owner of its new children", () => {
      const owner = new MockOwner();
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true)
      }, owner);
      const clone = cell.clone();
      expect(clone.row.boolean.owner).to.be.undefined;
    });

    it("should not create a new schema object if not told to", () => {
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true)
      });
      const clone = cell.clone();
      expect(cell.schema).to.equal(clone.schema);
    });

    it("should not create a new schema object for its children if not told to", () => {
      const cell = new cells.ObjectCell(nestedObjectSchema, {
        obj: new cells.ObjectCell(testSchema, {
          boolean: new cells.BooleanCell(true)
        })
      });

      const clone = cell.clone();

      expect(clone.row.obj.asAny.schema).to.equal(testSchema);
    });

    it("should create a new schema object if told to", () => {
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true)
      });
      const clone = cell.clone({ cloneSchema: true });
      expect(cell.schema).to.not.equal(clone.schema);
    });

    it("should create a new schema object for its children if told to", () => {
      const cell = new cells.ObjectCell(nestedObjectSchema, {
        obj: new cells.ObjectCell(testSchema, {
          boolean: new cells.BooleanCell(true)
        })
      });

      const clone = cell.clone({ cloneSchema: true });

      expect(clone.row.obj.asAny.schema).to.not.equal(testSchema);
    });
  });

  describe("#encode()", () => {
    it("should write the given (negative) offset", () => {
      const buffer = Buffer.alloc(4);
      const encoder = new BinaryEncoder(buffer);
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true),
        string: new cells.TextCell(SimDataType.String, "Hi"),
        uint32: new cells.NumberCell(SimDataType.UInt32, 15)
      });
      cell.encode(encoder, { offset: -5 });
      const decoder = encoder.getDecoder();
      expect(decoder.int32()).to.equal(-5);
    });

    it("should write the given (positive) offset", () => {
      const buffer = Buffer.alloc(4);
      const encoder = new BinaryEncoder(buffer);
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true),
        string: new cells.TextCell(SimDataType.String, "Hi"),
        uint32: new cells.NumberCell(SimDataType.UInt32, 15)
      });
      cell.encode(encoder, { offset: 5 });
      const decoder = encoder.getDecoder();
      expect(decoder.int32()).to.equal(5);
    });

    it("should throw if no offset is provided", () => {
      const encoder = new BinaryEncoder(Buffer.alloc(4));
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true),
        string: new cells.TextCell(SimDataType.String, "Hi"),
        uint32: new cells.NumberCell(SimDataType.UInt32, 15)
      });
      expect(() => cell.encode(encoder)).to.throw();
    });

    it("should throw if the object cell is invalid", () => {
      const encoder = new BinaryEncoder(Buffer.alloc(4));
      const cell = new cells.ObjectCell(testSchema, {});
      expect(() => cell.encode(encoder, { offset: 5 })).to.throw();
    });

    it("should not throw if there is just an issue with cache validation", () => {
      const encoder = new BinaryEncoder(Buffer.alloc(4));
      const cell = new cells.ObjectCell(testSchema, {
        boolean: new cells.BooleanCell(true),
        string: new cells.TextCell(SimDataType.String, "Hi"),
        uint32: new cells.NumberCell(SimDataType.UInt32, 15)
      });
      cell.row.boolean.owner = new MockOwner();
      expect(() => cell.encode(encoder, { offset: 5 })).to.not.throw();
    });
  });

  describe("#toXmlNode()", () => {
    it("should write the name of the schema in an attribute", () => {
      const cell = newValidObjectCell();
      const node = cell.toXmlNode();
      expect(node.attributes.schema).to.equal("TestSchema");
    });

    it("should use a U tag", () => {
      const cell = newValidObjectCell();
      const node = cell.toXmlNode();
      expect(node.tag).to.equal("U");
    });

    it("should write primitive children correctly", () => {
      const cell = newValidObjectCell();
      const node = cell.toXmlNode();
      expect(node.toXml()).to.equal(`<U schema="TestSchema">
  <T name="boolean">1</T>
  <T name="uint32">15</T>
  <T name="string">Hi</T>
</U>`);
    });

    it("should write another object child correctly", () => {
      const cell = new cells.ObjectCell(nestedObjectSchema, {
        obj: newValidObjectCell()
      });
      const node = cell.toXmlNode();
      expect(node.toXml()).to.equal(`<U schema="NestedObject">
  <U name="obj" schema="TestSchema">
    <T name="boolean">1</T>
    <T name="uint32">15</T>
    <T name="string">Hi</T>
  </U>
</U>`)
    });

    it("should write a vector child correctly", () => {
      const vectorSchema = new SimDataSchema("VectorSchema", 0x12, [
        new SimDataSchemaColumn("vector", SimDataType.Vector, 0)
      ]);

      const cell = new cells.ObjectCell(vectorSchema, {
        vector: new cells.VectorCell([new cells.BooleanCell(true)])
      });

      const node = cell.toXmlNode();
      expect(node.toXml()).to.equal(`<U schema="VectorSchema">
  <L name="vector">
    <T type="Boolean">1</T>
  </L>
</U>`);
    });

    it("should write a variant child correctly", () => {
      const variantSchema = new SimDataSchema("VariantSchema", 0x12, [
        new SimDataSchemaColumn("variant", SimDataType.Variant, 0)
      ]);

      const cell = new cells.ObjectCell(variantSchema, {
        variant: new cells.VariantCell(0x1234, new cells.BooleanCell(true))
      });

      const node = cell.toXmlNode();
      expect(node.toXml()).to.equal(`<U schema="VariantSchema">
  <V name="variant" variant="0x00001234">
    <T type="Boolean">1</T>
  </V>
</U>`);
    });

    it("should write the Object type if told to", () => {
      const cell = newValidObjectCell();
      const node = cell.toXmlNode({ typeAttr: true });
      expect(node.attributes.type).to.equal("Object");
    });

    it("should write the provided name if given one", () => {
      const cell = newValidObjectCell();
      const node = cell.toXmlNode({ nameAttr: "something" });
      expect(node.attributes.name).to.equal("something");
    });
  });

  describe("#validate()", () => {
    it("should throw if there is no schema", () => {
      const cell = new cells.ObjectCell(undefined, {});
      expect(() => cell.validate()).to.throw();
    });

    it("should throw if this object has less columns than its schema", () => {
      const cell = new cells.ObjectCell(testSchema, {});
      expect(() => cell.validate()).to.throw();
    });

    it("should throw if this object has more columns than its schema", () => {
      const cell = newValidObjectCell();
      cell.row.variant = cells.VariantCell.getDefault();
      expect(() => cell.validate()).to.throw();
    });

    it("should throw if this object has the right number of columns, but a type is different", () => {
      const cell = newValidObjectCell();
      cell.row.boolean = cells.VariantCell.getDefault();
      expect(() => cell.validate()).to.throw();
    });

    it("should throw if this object is valid, but one of its children aren't", () => {
      const cell = newValidObjectCell();
      cell.row.uint32.asAny.value = -1;
      expect(() => cell.validate()).to.throw();
    });

    it("should not throw if this object and all of its children are valid", () => {
      const cell = newValidObjectCell();
      expect(() => cell.validate()).to.not.throw();
    });

    it("should throw if one of this object's children has a different owner and ignoreCache is false", () => {
      const cell = newValidObjectCell();
      cell.row.uint32.owner = new MockOwner();
      expect(() => cell.validate({ ignoreCache: false })).to.throw();
    });

    it("should not throw if one of this object's children has a different owner and ignoreCache is true", () => {
      const cell = newValidObjectCell();
      cell.row.uint32.owner = undefined;
      expect(() => cell.validate({ ignoreCache: true })).to.not.throw();
    });
  });

  describe("static#getDefault()", () => {
    it("should create a cell with the given schema", () => {
      const cell = cells.ObjectCell.getDefault(testSchema);
      expect(cell.schema).to.equal(testSchema);
    });

    it("should have no children", () => {
      const cell = cells.ObjectCell.getDefault(testSchema);
      expect(cell.rowLength).to.equal(0);
    });

    it("should not have an owner", () => {
      const cell = cells.ObjectCell.getDefault(testSchema);
      expect(cell.owner).to.be.undefined;
    });

    it("should have the object data type", () => {
      const cell = cells.ObjectCell.getDefault(testSchema);
      expect(cell.dataType).to.equal(SimDataType.Object);
    });
  });

  describe("static#fromXmlNode()", () => {
    const node = new XmlElementNode({
      tag: "U",
      attributes: {
        name: "obj",
        schema: "TestSchema"
      },
      children: [
        new XmlElementNode({
          tag: "T",
          attributes: {
            name: "boolean"
          },
          children: [
            new XmlValueNode(true)
          ]
        }),
        new XmlElementNode({
          tag: "T",
          attributes: {
            name: "uint32"
          },
          children: [
            new XmlValueNode(15)
          ]
        }),
        new XmlElementNode({
          tag: "T",
          attributes: {
            name: "string"
          },
          children: [
            new XmlValueNode("hi")
          ]
        })
      ]
    });

    it("should create a cell following a given schema", () => {
      const cell = cells.ObjectCell.fromXmlNode(node, [testSchema]);
      expect(cell.dataType).to.equal(SimDataType.Object);
      expect(cell.rowLength).to.equal(3);
      expect(cell.row.boolean?.asAny.value).to.equal(true);
      expect(cell.row.uint32?.asAny.value).to.equal(15);
      expect(cell.row.string?.asAny.value).to.equal("hi");
    });

    it("should contain a vector child if there is one", () => {
      const vectorSchema = new SimDataSchema("VectorSchema", 0x12, [
        new SimDataSchemaColumn("vector", SimDataType.Vector, 0)
      ]);

      const node = new XmlElementNode({
        tag: "U",
        attributes: {
          schema: "VectorSchema"
        },
        children: [
          new XmlElementNode({
            tag: "L",
            attributes: {
              name: "vector"
            },
            children: [
              new XmlElementNode({
                tag: "T",
                attributes: {
                  type: "Boolean"
                },
                children: [
                  new XmlValueNode("1")
                ]
              })
            ]
          })
        ]
      });

      const cell = cells.ObjectCell.fromXmlNode(node, [vectorSchema]);
      expect(cell.row.vector?.asAny.children[0].value).to.be.true;
    });

    it("should contain a variant child if there is one", () => {
      const variantSchema = new SimDataSchema("VariantSchema", 0x12, [
        new SimDataSchemaColumn("variant", SimDataType.Variant, 0)
      ]);

      const node = new XmlElementNode({
        tag: "U",
        attributes: {
          schema: "VariantSchema"
        },
        children: [
          new XmlElementNode({
            tag: "V",
            attributes: {
              name: "variant",
              variant: "0x00001234"
            },
            children: [
              new XmlElementNode({
                tag: "T",
                attributes: {
                  type: "Boolean"
                },
                children: [
                  new XmlValueNode("1")
                ]
              })
            ]
          })
        ]
      });

      const cell = cells.ObjectCell.fromXmlNode(node, [variantSchema]);
      expect(cell.row.variant?.asAny.child.value).to.be.true;
    });

    it("should contain an object child if there is one", () => {
      const parent = new XmlElementNode({
        tag: "U",
        attributes: {
          schema: "NestedObject",
        },
        children: [ node ]
      });

      const cell = cells.ObjectCell.fromXmlNode(parent, [testSchema, nestedObjectSchema]);

      expect(cell.rowLength).to.equal(1);
      const child: simDataCells.ObjectCell = cell.row.obj.asAny;
      expect(child.rowLength).to.equal(3);
      expect(child.row.boolean?.asAny.value).to.equal(true);
      expect(child.row.uint32?.asAny.value).to.equal(15);
      expect(child.row.string?.asAny.value).to.equal("hi");
    });

    it("should throw if object doesn't use one of the supplied schemas", () => {
      expect(() => cells.ObjectCell.fromXmlNode(node, [])).to.throw();
    });

    it("should throw if a child object doesn't use one of the supplied schemas", () => {
      const parent = new XmlElementNode({
        tag: "U",
        attributes: {
          schema: "NestedObject",
        },
        children: [ node ]
      });

      expect(() => cells.ObjectCell.fromXmlNode(parent, [testSchema])).to.throw();
    });

    it("should throw if node is missing a column for its schema", () => {
      const clone = node.clone();
      clone.children.splice(0, 1);
      expect(() => cells.ObjectCell.fromXmlNode(clone, [testSchema])).to.throw();
    });

    it("should throw if node has two of the same column", () => {
      const clone = node.clone();
      clone.addClones(clone.children[0]);
      expect(() => cells.ObjectCell.fromXmlNode(clone, [testSchema])).to.throw();
    });
  });
});

describe("VectorCell", () => {
  describe("#children", () => {
    it("should uncache the owner when pushed", () => {
      const owner = new MockOwner();
      const cell = new cells.VectorCell<simDataCells.BooleanCell>([], owner);
      expect(owner.cached).to.be.true;
      cell.children.push(new cells.BooleanCell(true));
      expect(owner.cached).to.be.false;
    });

    it("should set the owner of a child that is pushed", () => {
      const owner = new MockOwner();
      const cell = new cells.VectorCell<simDataCells.BooleanCell>([], owner);
      const child = new cells.BooleanCell(true);
      cell.children.push(child);
      expect(child.owner).to.equal(owner);
    });

    it("should uncache the owner when spliced", () => {
      const owner = new MockOwner();
      const cell = new cells.VectorCell<simDataCells.BooleanCell>([
        new cells.BooleanCell(true)
      ], owner);
      expect(owner.cached).to.be.true;
      cell.children.splice(0, 1);
      expect(owner.cached).to.be.false;
    });

    it("should uncache the owner when a child is mutated", () => {
      const owner = new MockOwner();
      const cell = new cells.VectorCell<simDataCells.BooleanCell>([
        new cells.BooleanCell(true)
      ], owner);
      expect(owner.cached).to.be.true;
      cell.children[0].value = false;
      expect(owner.cached).to.be.false;
    });

    it("should uncache the owner when a child is set", () => {
      const owner = new MockOwner();
      const cell = new cells.VectorCell<simDataCells.BooleanCell>([
        new cells.BooleanCell(true)
      ], owner);
      expect(owner.cached).to.be.true;
      cell.children[0] = new cells.BooleanCell(false);
      expect(owner.cached).to.be.false;
    });

    it("should set the owner of a child that is set", () => {
      const owner = new MockOwner();
      const cell = new cells.VectorCell<simDataCells.BooleanCell>([
        new cells.BooleanCell(true)
      ], owner);
      const child = new cells.BooleanCell(false);
      cell.children[0] = child;
      expect(child.owner).to.equal(owner);
    });

    it("should not uncache the owner when a child is retrieved", () => {
      const owner = new MockOwner();
      const cell = new cells.VectorCell<simDataCells.BooleanCell>([
        new cells.BooleanCell(true)
      ], owner);
      expect(owner.cached).to.be.true;
      const child = cell.children[0];
      expect(owner.cached).to.be.true;
    });
  });

  describe("#childType", () => {
    it("should return the data type of the first child", () => {
      const cell = new cells.VectorCell<simDataCells.BooleanCell>([
        cells.BooleanCell.getDefault()
      ]);
      expect(cell.childType).to.equal(SimDataType.Boolean);
    });

    it("should return undefined when there are no children", () => {
      const cell = cells.VectorCell.getDefault();
      expect(cell.childType).to.be.undefined;
    });
  });

  describe("#length", () => {
    it("should return 0 when there are no children", () => {
      const cell = cells.VectorCell.getDefault();
      expect(cell.length).to.equal(0);
    });

    it("should return the number of children in the array", () => {
      const cell = new cells.VectorCell<simDataCells.BooleanCell>([
        cells.BooleanCell.getDefault()
      ]);
      expect(cell.length).to.equal(1);
    });

    it("should return the correct number after adding a child", () => {
      const cell = new cells.VectorCell<simDataCells.BooleanCell>([
        cells.BooleanCell.getDefault()
      ]);
      cell.children.push(cells.BooleanCell.getDefault());
      expect(cell.length).to.equal(2);
    });

    it("should return the correct number after deleting a child", () => {
      const cell = new cells.VectorCell<simDataCells.BooleanCell>([
        cells.BooleanCell.getDefault(),
        cells.BooleanCell.getDefault()
      ]);
      cell.children.splice(0, 1);
      expect(cell.length).to.equal(1);
    });
  });

  describe("#owner", () => {
    it("should update the owner of all children when set", () => {
      const owner = new MockOwner();
      const child1 = cells.BooleanCell.getDefault();
      const child2 = cells.BooleanCell.getDefault();
      const cell = new cells.VectorCell<simDataCells.BooleanCell>([
        child1,
        child2
      ], owner);
      const newOwner = new MockOwner();
      cell.owner = newOwner;
      expect(child1.owner).to.equal(newOwner);
      expect(child2.owner).to.equal(newOwner);
    });
  });

  describe("#constructor", () => {
    it("should set the owner of all given children", () => {
      const owner = new MockOwner();
      const child1 = cells.BooleanCell.getDefault();
      const child2 = cells.BooleanCell.getDefault();
      const cell = new cells.VectorCell<simDataCells.BooleanCell>([
        child1,
        child2
      ], owner);
      expect(child1.owner).to.equal(owner);
      expect(child2.owner).to.equal(owner);
    });

    it("should contain the given children", () => {
      const child1 = cells.BooleanCell.getDefault();
      const child2 = cells.BooleanCell.getDefault();
      const cell = new cells.VectorCell<simDataCells.BooleanCell>([
        child1,
        child2
      ]);
      expect(cell.children.length).to.equal(2);
      expect(cell.children[0]).to.equal(child1);
      expect(cell.children[1]).to.equal(child2);
    });

    it("should use the owner that is given", () => {
      const owner = new MockOwner();
      const cell = new cells.VectorCell([], owner);
      expect(cell.owner).to.equal(owner);
    });

    it("should not have an owner if one isn't given", () => {
      const cell = new cells.VectorCell([]);
      expect(cell.owner).to.be.undefined;
    });
  });

  describe("#pushClones()", () => {
    it("should add the given children", () => {
      const cell = cells.VectorCell.getDefault<simDataCells.BooleanCell>();
      cell.pushClones(new cells.BooleanCell(true));
      expect(cell.length).to.equal(1);
      expect(cell.children[0].value).to.be.true;
    });

    it("should not mutate the original children (they should be clones)", () => {
      const cell = cells.VectorCell.getDefault<simDataCells.BooleanCell>();
      const child = new cells.BooleanCell(true);
      cell.pushClones(child);
      const childClone = cell.children[0];
      expect(childClone).to.not.equal(child);
      childClone.value = false;
      expect(childClone.value).to.be.false;
      expect(child.value).to.be.true;
    }); 
  
    it("should uncache the owner", () => {
      const owner = new MockOwner();
      const cell = new cells.VectorCell([], owner);
      expect(owner.cached).to.be.true;
      cell.pushClones(new cells.BooleanCell(true));
      expect(owner.cached).to.be.false;
    });

    it("should set the owner of the clones", () => {
      const owner = new MockOwner();
      const cell = new cells.VectorCell([], owner);
      cell.pushClones(new cells.BooleanCell(true));
      expect(cell.children[0].owner).to.equal(owner);
    });

    it("should not change the owner of the cell that is given", () => {
      const vectorOwner = new MockOwner();
      const booleanOwner = new MockOwner();
      const cell = new cells.VectorCell([], vectorOwner);
      const child = new cells.BooleanCell(true, booleanOwner);
      cell.pushClones(child);
      expect(child.owner).to.equal(booleanOwner);
    });
  });

  describe("#removeChildren()", () => {
    it("should remove the one child that is given", () => {
      const childToRemove = cells.BooleanCell.getDefault();
      const cell = new cells.VectorCell([
        childToRemove
      ]);
      cell.removeChildren(childToRemove);
      expect(cell.children).to.be.empty;
    });

    it("should remove the children that are given", () => {
      const childToRemove1 = new cells.BooleanCell(true);
      const childToRemove2 = new cells.BooleanCell(false);
      const cell = new cells.VectorCell([
        childToRemove1,
        childToRemove2
      ]);
      cell.removeChildren(childToRemove1, childToRemove2);
      expect(cell.children).to.be.empty;
    });

    it("should do nothing if a child that doesn't belong to this vector is given", () => {
      const childToRemove = new cells.BooleanCell(true);
      const cell = new cells.VectorCell([
        new cells.BooleanCell(false)
      ]);
      cell.removeChildren(childToRemove);
      expect(cell.length).to.equal(1);
    });

    it("should only remove the first child if this vector contains two of the same object", () => {
      const childToRemove = new cells.BooleanCell(true);
      const cell = new cells.VectorCell([
        childToRemove,
        childToRemove
      ]);
      cell.removeChildren(childToRemove);
      expect(cell.length).to.equal(1);
    });

    it("should not remove any children that are not given", () => {
      const childToRemove2 = new cells.BooleanCell(false);
      const cell = new cells.VectorCell([
        new cells.BooleanCell(true),
        childToRemove2
      ]);
      cell.removeChildren(childToRemove2);
      expect(cell.length).to.equal(1);
      expect(cell.children[0].value).to.be.true;
    });

    it("should not remove an identical, but different, cell that it contains", () => {
      const childToRemove = new cells.BooleanCell(true);
      const cell = new cells.VectorCell([
        new cells.BooleanCell(true)
      ]);
      cell.removeChildren(childToRemove);
      expect(cell.length).to.equal(1);
    });

    it("should uncache the owner if at least one child is removed", () => {
      const owner = new MockOwner();
      const childToRemove = new cells.BooleanCell(true);
      const cell = new cells.VectorCell([
        childToRemove
      ], owner);
      expect(owner.cached).to.be.true;
      cell.removeChildren(childToRemove);
      expect(owner.cached).to.be.false;
    });

    it("should not uncache the owner if no children are removed", () => {
      const owner = new MockOwner();
      const childToRemove = new cells.BooleanCell(true);
      const cell = new cells.VectorCell([
        new cells.BooleanCell(false)
      ], owner);
      expect(owner.cached).to.be.true;
      cell.removeChildren(childToRemove);
      expect(owner.cached).to.be.true;
    });
  });

  describe("#encode()", () => {
    it("should throw if no offset is provided", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new cells.VectorCell([]);
      expect(() => cell.encode(encoder)).to.throw();
    });

    it("should throw if the vector is invalid", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new cells.VectorCell([
        cells.BooleanCell.getDefault(),
        cells.NumberCell.getDefault(SimDataType.UInt32)
      ]);
      expect(() => cell.encode(encoder, { offset: 4 })).to.throw();
    });

    it("should write the offset and correct number of children (0) if given and valid", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new cells.VectorCell([]);
      cell.encode(encoder, { offset: 10 });
      const decoder = encoder.getDecoder();
      expect(decoder.int32()).to.equal(10);
      expect(decoder.uint32()).to.equal(0);
    });

    it("should write the offset and correct number of children (1) if given and valid", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new cells.VectorCell([
        cells.BooleanCell.getDefault()
      ]);
      cell.encode(encoder, { offset: 10 });
      const decoder = encoder.getDecoder();
      expect(decoder.int32()).to.equal(10);
      expect(decoder.uint32()).to.equal(1);
    });

    it("should write the offset and correct number of children (2+) if given and valid", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new cells.VectorCell([
        cells.BooleanCell.getDefault(),
        cells.BooleanCell.getDefault()
      ]);
      cell.encode(encoder, { offset: 10 });
      const decoder = encoder.getDecoder();
      expect(decoder.int32()).to.equal(10);
      expect(decoder.uint32()).to.equal(2);
    });

    it("should write a negative offset", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new cells.VectorCell([
        cells.BooleanCell.getDefault(),
        cells.BooleanCell.getDefault()
      ]);
      cell.encode(encoder, { offset: -10 });
      const decoder = encoder.getDecoder();
      expect(decoder.int32()).to.equal(-10);
      expect(decoder.uint32()).to.equal(2);
    });
  });

  describe("#toXmlNode()", () => {
    it("should use an L tag", () => {
      const cell = cells.VectorCell.getDefault();
      const node = cell.toXmlNode();
      expect(node.tag).to.equal("L");
    });

    it("should write the name that is given", () => {
      const cell = cells.VectorCell.getDefault();
      const node = cell.toXmlNode({ nameAttr: "vector" });
      expect(node.attributes.name).to.equal("vector");
      expect(node.toXml()).to.equal(`<L name="vector"/>`);
    });

    it("should write its type if told to", () => {
      const cell = cells.VectorCell.getDefault();
      const node = cell.toXmlNode({ typeAttr: true });
      expect(node.attributes.type).to.equal("Vector");
      expect(node.toXml()).to.equal(`<L type="Vector"/>`);
    });

    it("should be empty if there are no children", () => {
      const cell = cells.VectorCell.getDefault();
      const node = cell.toXmlNode();
      expect(node.children).to.be.an('Array').that.is.empty;
      expect(node.toXml()).to.equal(`<L/>`);
    });

    it("should contain its children and write their types", () => {
      const cell = new cells.VectorCell([
        new cells.BooleanCell(true),
        new cells.BooleanCell(false),
      ]);
      const node = cell.toXmlNode();
      expect(node.children).to.have.lengthOf(2);
      expect(node.children[0].attributes.type).to.equal("Boolean");
      expect(node.children[1].attributes.type).to.equal("Boolean");
      expect(node.toXml()).to.equal(`<L>
  <T type="Boolean">1</T>
  <T type="Boolean">0</T>
</L>`);
    });
  });

  describe("#validate()", () => {
    it("should throw if there are two children with different types", () => {
      const cell = new cells.VectorCell([
        new cells.BooleanCell(true),
        new cells.NumberCell(SimDataType.UInt32, 15)
      ]);

      expect(() => cell.validate()).to.throw();
    });

    it("should throw if this vector is valid, but one of its children isn't", () => {
      const cell = new cells.VectorCell([
        new cells.NumberCell(SimDataType.UInt32, 15),
        new cells.NumberCell(SimDataType.UInt32, -15)
      ]);

      expect(() => cell.validate()).to.throw();
    });

    it("should not throw if this vector and all of its children are valid", () => {
      const cell = new cells.VectorCell([
        new cells.NumberCell(SimDataType.UInt32, 15),
        new cells.NumberCell(SimDataType.UInt32, 15)
      ]);

      expect(() => cell.validate()).to.not.throw();
    });

    it("should throw if one of this vector's children has a different owner and ignoreCache is false", () => {
      const child = cells.BooleanCell.getDefault();
      const owner = new MockOwner();
      const cell = new cells.VectorCell([ child ], owner);
      child.owner = new MockOwner();
      expect(() => cell.validate({ ignoreCache: false })).to.throw();
    });

    it("should not throw if one of this vector's children has a different owner and ignoreCache is true", () => {
      const child = cells.BooleanCell.getDefault();
      const owner = new MockOwner();
      const cell = new cells.VectorCell([ child ], owner);
      child.owner = new MockOwner();
      expect(() => cell.validate({ ignoreCache: true })).to.not.throw();
    });
  });

  describe("static#getDefault()", () => {
    it("should have a type of Vector", () => {
      const cell = cells.VectorCell.getDefault();
      expect(cell.dataType).to.equal(SimDataType.Vector);
    });

    it("should not have an owner", () => {
      const cell = cells.VectorCell.getDefault();
      expect(cell.owner).to.be.undefined;
    });

    it("should have an empty array of children", () => {
      const cell = cells.VectorCell.getDefault();
      expect(cell.children).to.be.an('Array').that.is.empty;
    });
  });

  describe("static#fromXmlNode()", () => {
    const validNode = new XmlElementNode({
      tag: "L",
      children: [
        new XmlElementNode({
          tag: "T",
          attributes: {
            type: "Boolean"
          },
          children: [
            new XmlValueNode(true)
          ]
        }),
        new XmlElementNode({
          tag: "T",
          attributes: {
            type: "Boolean"
          },
          children: [
            new XmlValueNode(false)
          ]
        })
      ]
    });

    it("should throw if first child doesn't specify its type", () => {
      const node = validNode.clone();
      delete node.children[0].attributes.type;
      expect(() => cells.VectorCell.fromXmlNode(node)).to.throw();
    });

    it("should throw if other child doesn't specify its type", () => {
      const node = validNode.clone();
      delete node.children[1].attributes.type;
      expect(() => cells.VectorCell.fromXmlNode(node)).to.throw();
    });

    it("should throw if two children have mismatched types", () => {
      const node = validNode.clone();
      node.children[1].attributes.type = "Single";
      node.children[1].innerValue = 1.5;
      expect(() => cells.VectorCell.fromXmlNode(node)).to.throw();
    });

    it("should read children correctly", () => {
      const cell = cells.VectorCell.fromXmlNode<simDataCells.BooleanCell>(validNode);
      expect(cell.children).to.have.lengthOf(2);
      const [ child1, child2 ] = cell.children;
      expect(child1.dataType).to.equal(SimDataType.Boolean);
      expect(child1.value).to.be.true;
      expect(child2.dataType).to.equal(SimDataType.Boolean);
      expect(child2.value).to.be.false;
    });

    it("should read vector children correctly", () => {
      const node = new XmlElementNode({
        tag: "L",
        children: [
          new XmlElementNode({
            tag: "L",
            attributes: {
              type: "Vector"
            },
            children: [
              new XmlElementNode({
                tag: "T",
                attributes: {
                  type: "Single"
                },
                children: [
                  new XmlValueNode(1.5)
                ]
              })
            ]
          })
        ]
      });

      const cell = cells.VectorCell.fromXmlNode<simDataCells.VectorCell<simDataCells.NumberCell>>(node);
      expect(cell.childType).to.equal(SimDataType.Vector);
      expect(cell.length).to.equal(1);
      const single = cell.children[0].children[0];
      expect(single.dataType).to.equal(SimDataType.Float);
      expect(single.value).to.be.approximately(1.5, 0.001);
    });

    it("should read variant children correctly", () => {
      const node = new XmlElementNode({
        tag: "L",
        children: [
          new XmlElementNode({
            tag: "V",
            attributes: {
              type: "Variant",
              variant: "0x12345678"
            },
            children: [
              new XmlElementNode({
                tag: "T",
                attributes: {
                  type: "Single"
                },
                children: [
                  new XmlValueNode(1.5)
                ]
              })
            ]
          })
        ]
      });

      const cell = cells.VectorCell.fromXmlNode<simDataCells.VariantCell<simDataCells.NumberCell>>(node);
      expect(cell.childType).to.equal(SimDataType.Variant);
      expect(cell.length).to.equal(1);
      const single = cell.children[0].child;
      expect(single.dataType).to.equal(SimDataType.Float);
      expect(single.value).to.be.approximately(1.5, 0.001);
    });

    it("should read object children correctly, if its schema is provided", () => {
      const node = new XmlElementNode({
        tag: "L",
        children: [
          new XmlElementNode({
            tag: "U",
            attributes: {
              type: "Object",
              schema: "TestSchema"
            },
            children: [
              new XmlElementNode({
                tag: "T",
                attributes: {
                  name: "boolean"
                },
                children: [
                  new XmlValueNode(true)
                ]
              }),
              new XmlElementNode({
                tag: "T",
                attributes: {
                  name: "uint32"
                },
                children: [
                  new XmlValueNode(15)
                ]
              }),
              new XmlElementNode({
                tag: "T",
                attributes: {
                  name: "string"
                },
                children: [
                  new XmlValueNode("hi")
                ]
              })
            ]
          })
        ]
      });

      const cell = cells.VectorCell.fromXmlNode<simDataCells.ObjectCell>(node, [testSchema]);
      expect(cell.length).to.equal(1);
      const obj = cell.children[0];
      expect(obj.rowLength).to.equal(3);
      expect(obj.row.boolean.asAny.value).to.equal(true);
      expect(obj.row.uint32.asAny.value).to.equal(15);
      expect(obj.row.string.asAny.value).to.equal("hi");
    });

    it("should throw if children are objects but their schema wasn't provided", () => {
      const node = new XmlElementNode({
        tag: "L",
        children: [
          new XmlElementNode({
            tag: "U",
            attributes: {
              type: "Object",
              schema: "TestSchema"
            },
            children: [
              new XmlElementNode({
                tag: "T",
                attributes: {
                  name: "boolean"
                },
                children: [
                  new XmlValueNode(true)
                ]
              }),
              new XmlElementNode({
                tag: "T",
                attributes: {
                  name: "uint32"
                },
                children: [
                  new XmlValueNode(15)
                ]
              }),
              new XmlElementNode({
                tag: "T",
                attributes: {
                  name: "string"
                },
                children: [
                  new XmlValueNode("hi")
                ]
              })
            ]
          })
        ]
      });

      expect(() => cells.VectorCell.fromXmlNode(node)).to.throw();
    });

    it("should not have an owner", () => {
      const cell = cells.VectorCell.fromXmlNode(validNode);
      expect(cell.owner).to.be.undefined;
    });

    it("should not set the owner of its children", () => {
      const cell = cells.VectorCell.fromXmlNode(validNode);
      cell.children.forEach(child => {
        expect(child.owner).to.be.undefined;
      });
    });
  });
});

describe("VariantCell", () => {
  describe("#child", () => {
    it("should uncache the owner when set", () => {
      // TODO:
    });

    it("should uncache the owner when mutated", () => {
      // TODO:
    });

    it("should uncache the owner when deleted", () => {
      // TODO:
    });
  });

  describe("#childType", () => {
    it("should be undefined if there is no child", () => {
      // TODO:
    });

    it("should be the data type of the child", () => {
      // TODO:
    });
  });

  describe("#owner", () => {
    it("should update the owner of the child when set", () => {
      // TODO:
    });
  });

  describe("#typeHash", () => {
    it("should uncache the owner when set", () => {
      // TODO:
    });
  });

  describe("#constructor", () => {
    it("should have the given type hash", () => {
      // TODO:
    });

    it("should set the owner of the given child", () => {
      // TODO:
    });

    it("should contain the given child", () => {
      // TODO:
    });

    it("should use the owner that is given", () => {
      // TODO:
    });

    it("should not have an owner if one isn't given", () => {
      // TODO:
    });

    it("should not set the owner of the child if one isn't given", () => {
      // TODO:
    });
  });

  describe("#clone()", () => {
    it("should not mutate the original", () => {
      // TODO:
    });

    it("should not mutate the child of the original", () => {
      // TODO:
    });

    it("should copy the type hash", () => {
      // TODO:
    });

    it("should copy the child", () => {
      // TODO:
    });

    it("should not copy the owner", () => {
      // TODO:
    });

    it("should not copy the owner of the child", () => {
      // TODO:
    });
  });

  describe("#encode()", () => {
    it("should throw if no offset is provided", () => {
      // const buffer = Buffer.alloc(8);
      // const encoder = new BinaryEncoder(buffer);
      // const cell = new cells.VectorCell([]);
      // expect(() => cell.encode(encoder)).to.throw();
      // TODO:
    });

    it("should throw if the variant is invalid", () => {
      // const buffer = Buffer.alloc(8);
      // const encoder = new BinaryEncoder(buffer);
      // const cell = new cells.VectorCell([
      //   cells.BooleanCell.getDefault(),
      //   cells.NumberCell.getDefault(SimDataType.UInt32)
      // ]);
      // expect(() => cell.encode(encoder, { offset: 4 })).to.throw();
      // TODO:
    });

    it("should write the (positive) offset and type hash", () => {
      // const buffer = Buffer.alloc(8);
      // const encoder = new BinaryEncoder(buffer);
      // const cell = new cells.VectorCell([]);
      // cell.encode(encoder, { offset: 10 });
      // const decoder = encoder.getDecoder();
      // expect(decoder.int32()).to.equal(10);
      // expect(decoder.uint32()).to.equal(0);
      // TODO:
    });

    it("should write the (negative) offset and type hash", () => {
      // const buffer = Buffer.alloc(8);
      // const encoder = new BinaryEncoder(buffer);
      // const cell = new cells.VectorCell([]);
      // cell.encode(encoder, { offset: 10 });
      // const decoder = encoder.getDecoder();
      // expect(decoder.int32()).to.equal(10);
      // expect(decoder.uint32()).to.equal(0);
      // TODO:
    });
  });

  describe("#toXmlNode()", () => {
    it("should use a V tag", () => {
      const cell = cells.VariantCell.getDefault();
      const node = cell.toXmlNode();
      expect(node.tag).to.equal("V");
    });

    it("should write the variant type hash in hex", () => {
      const cell = new cells.VariantCell(0x00001234, undefined);
      const node = cell.toXmlNode();
      expect(node.attributes.variant).to.equal("0x00001234");
      expect(node.toXml()).to.equal(`<V variant="0x00001234"/>`);
    });

    it("should write the name that is given", () => {
      const cell = cells.VariantCell.getDefault();
      const node = cell.toXmlNode({ nameAttr: "variant" });
      expect(node.attributes.name).to.equal("variant");
      expect(node.toXml()).to.equal(`<V name="variant" variant="0x00000000"/>`);
    });

    it("should write its type if told to", () => {
      const cell = cells.VariantCell.getDefault();
      const node = cell.toXmlNode({ typeAttr: true });
      expect(node.attributes.type).to.equal("Variant");
      expect(node.toXml()).to.equal(`<V type="Variant" variant="0x00000000"/>`);
    });

    it("should be empty if there is no child", () => {
      const cell = cells.VariantCell.getDefault();
      const node = cell.toXmlNode();
      expect(node.toXml()).to.equal(`<V variant="0x00000000"/>`);
    });

    it("should contain its child and write its type", () => {
      // TODO:
//       const cell = new cells.VectorCell([
//         new cells.BooleanCell(true),
//         new cells.BooleanCell(false),
//       ]);
//       const node = cell.toXmlNode();
//       expect(node.children).to.have.lengthOf(2);
//       expect(node.children[0].attributes.type).to.equal("Boolean");
//       expect(node.children[1].attributes.type).to.equal("Boolean");
//       expect(node.toXml()).to.equal(`<L>
//   <T type="Boolean">1</T>
//   <T type="Boolean">0</T>
// </L>`);
    });
  });

  describe("#validate()", () => {
    it("should throw if this variant is valid, but its child isn't", () => {
      // const cell = new cells.VectorCell([
      //   new cells.NumberCell(SimDataType.UInt32, 15),
      //   new cells.NumberCell(SimDataType.UInt32, -15)
      // ]);

      // expect(() => cell.validate()).to.throw();
      // TODO:
    });

    it("should not throw if this variant and its child are valid", () => {
      // const cell = new cells.VectorCell([
      //   new cells.NumberCell(SimDataType.UInt32, 15),
      //   new cells.NumberCell(SimDataType.UInt32, 15)
      // ]);

      // expect(() => cell.validate()).to.not.throw();
      // TODO:
    });

    it("should throw if the child's owner is different and ignoreCache is false", () => {
      // TODO:
    });

    it("should throw if this variant's type hash is undefined", () => {
      // TODO:
    });

    it("should throw if this variant's type hash is null", () => {
      // TODO:
    });

    it("should throw if this variant's type hash is NaN", () => {
      // TODO:
    });

    it("should not throw if the child's owner is different and ignoreCache is true", () => {
      // TODO:
    });
  });

  describe("static#getDefault()", () => {
    it("should have a type of Variant", () => {
      const cell = cells.VariantCell.getDefault();
      expect(cell.dataType).to.equal(SimDataType.Variant);
    });

    it("should not have an owner", () => {
      const cell = cells.VariantCell.getDefault();
      expect(cell.owner).to.be.undefined;
    });

    it("should not have a child", () => {
      const cell = cells.VariantCell.getDefault();
      expect(cell.child).to.be.undefined;
    });

    it("should have a type hash of 0", () => {
      const cell = cells.VariantCell.getDefault();
      expect(cell.typeHash).to.equal(0);
    });
  });

  describe("static#fromXmlNode()", () => {
    const validNode = new XmlElementNode({
      tag: "V",
      attributes: {
        variant: "0x12345678"
      },
      children: [
        new XmlElementNode({
          tag: "T",
          attributes: {
            type: "Boolean"
          },
          children: [
            new XmlValueNode(true)
          ]
        })
      ]
    });

    it("should throw if child doesn't specify its type", () => {
      const node = validNode.clone();
      delete node.child.attributes.type;
      expect(() => cells.VariantCell.fromXmlNode(node)).to.throw();
    });

    it("should read child correctly", () => {
      // const cell = cells.VectorCell.fromXmlNode<simDataCells.BooleanCell>(validNode);
      // expect(cell.children).to.have.lengthOf(2);
      // const [ child1, child2 ] = cell.children;
      // expect(child1.dataType).to.equal(SimDataType.Boolean);
      // expect(child1.value).to.be.true;
      // expect(child2.dataType).to.equal(SimDataType.Boolean);
      // expect(child2.value).to.be.false;
      // TODO:
    });

    it("should read vector child correctly", () => {
      // TODO:
      // const node = new XmlElementNode({
      //   tag: "L",
      //   children: [
      //     new XmlElementNode({
      //       tag: "L",
      //       attributes: {
      //         type: "Vector"
      //       },
      //       children: [
      //         new XmlElementNode({
      //           tag: "T",
      //           attributes: {
      //             type: "Single"
      //           },
      //           children: [
      //             new XmlValueNode(1.5)
      //           ]
      //         })
      //       ]
      //     })
      //   ]
      // });

      // const cell = cells.VectorCell.fromXmlNode<simDataCells.VectorCell<simDataCells.NumberCell>>(node);
      // expect(cell.childType).to.equal(SimDataType.Vector);
      // expect(cell.length).to.equal(1);
      // const single = cell.children[0].children[0];
      // expect(single.dataType).to.equal(SimDataType.Float);
      // expect(single.value).to.be.approximately(1.5, 0.001);
    });

    it("should read variant child correctly", () => {
      // TODO:
      // const node = new XmlElementNode({
      //   tag: "L",
      //   children: [
      //     new XmlElementNode({
      //       tag: "V",
      //       attributes: {
      //         type: "Variant",
      //         variant: "0x12345678"
      //       },
      //       children: [
      //         new XmlElementNode({
      //           tag: "T",
      //           attributes: {
      //             type: "Single"
      //           },
      //           children: [
      //             new XmlValueNode(1.5)
      //           ]
      //         })
      //       ]
      //     })
      //   ]
      // });

      // const cell = cells.VectorCell.fromXmlNode<simDataCells.VariantCell<simDataCells.NumberCell>>(node);
      // expect(cell.childType).to.equal(SimDataType.Variant);
      // expect(cell.length).to.equal(1);
      // const single = cell.children[0].child;
      // expect(single.dataType).to.equal(SimDataType.Float);
      // expect(single.value).to.be.approximately(1.5, 0.001);
    });

    it("should read object child correctly, if its schema is provided", () => {
      // TODO:
      // const node = new XmlElementNode({
      //   tag: "L",
      //   children: [
      //     new XmlElementNode({
      //       tag: "U",
      //       attributes: {
      //         type: "Object",
      //         schema: "TestSchema"
      //       },
      //       children: [
      //         new XmlElementNode({
      //           tag: "T",
      //           attributes: {
      //             name: "boolean"
      //           },
      //           children: [
      //             new XmlValueNode(true)
      //           ]
      //         }),
      //         new XmlElementNode({
      //           tag: "T",
      //           attributes: {
      //             name: "uint32"
      //           },
      //           children: [
      //             new XmlValueNode(15)
      //           ]
      //         }),
      //         new XmlElementNode({
      //           tag: "T",
      //           attributes: {
      //             name: "string"
      //           },
      //           children: [
      //             new XmlValueNode("hi")
      //           ]
      //         })
      //       ]
      //     })
      //   ]
      // });

      // const cell = cells.VectorCell.fromXmlNode<simDataCells.ObjectCell>(node, [testSchema]);
      // expect(cell.length).to.equal(1);
      // const obj = cell.children[0];
      // expect(obj.rowLength).to.equal(3);
      // expect(obj.row.boolean.asAny.value).to.equal(true);
      // expect(obj.row.uint32.asAny.value).to.equal(15);
      // expect(obj.row.string.asAny.value).to.equal("hi");
    });

    it("should throw if child is an object but its schema wasn't provided", () => {
      // TODO:
      // const node = new XmlElementNode({
      //   tag: "L",
      //   children: [
      //     new XmlElementNode({
      //       tag: "U",
      //       attributes: {
      //         type: "Object",
      //         schema: "TestSchema"
      //       },
      //       children: [
      //         new XmlElementNode({
      //           tag: "T",
      //           attributes: {
      //             name: "boolean"
      //           },
      //           children: [
      //             new XmlValueNode(true)
      //           ]
      //         }),
      //         new XmlElementNode({
      //           tag: "T",
      //           attributes: {
      //             name: "uint32"
      //           },
      //           children: [
      //             new XmlValueNode(15)
      //           ]
      //         }),
      //         new XmlElementNode({
      //           tag: "T",
      //           attributes: {
      //             name: "string"
      //           },
      //           children: [
      //             new XmlValueNode("hi")
      //           ]
      //         })
      //       ]
      //     })
      //   ]
      // });

      // expect(() => cells.VectorCell.fromXmlNode(node)).to.throw();
    });

    it("should not have an owner", () => {
      const cell = cells.VariantCell.fromXmlNode(validNode);
      expect(cell.owner).to.be.undefined;
    });

    it("should not set the owner of its child", () => {
      const cell = cells.VariantCell.fromXmlNode(validNode);
      expect(cell.child.owner).to.be.undefined;
    });
  });
});

//#endregion Tests
