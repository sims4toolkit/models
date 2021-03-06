import { expect } from "chai";
import { XmlElementNode, XmlValueNode } from "@s4tk/xml-dom";
import { BinaryEncoder } from "@s4tk/encoding";
import { BooleanCell, NumberCell, ObjectCell, SimDataSchema, SimDataSchemaColumn, TextCell, VariantCell, VectorCell } from "../../../../dst/simdata";
import MockOwner from "../../../mocks/mock-owner";
import { DataType } from "../../../../dst/enums";

//#region Helpers

const testSchema = new SimDataSchema("TestSchema", 0x1234, [
  new SimDataSchemaColumn("boolean", DataType.Boolean, 0),
  new SimDataSchemaColumn("uint32", DataType.UInt32, 0),
  new SimDataSchemaColumn("string", DataType.String, 0)
]);

const nestedObjectSchema = new SimDataSchema("NestedObject", 0x12, [
  new SimDataSchemaColumn("obj", DataType.Object, 0)
]);

function newValidObjectCell(): ObjectCell {
  return new ObjectCell(testSchema, {
    boolean: new BooleanCell(true),
    uint32: new NumberCell(DataType.UInt32, 15),
    string: new TextCell(DataType.String, "Hi")
  });
}

//#endregion Helpers

//#region Tests

describe("ObjectCell", () => {
  describe("#owner", () => {
    it("should update the owner of all children when set", () => {
      const firstOwner = new MockOwner();
      const boolean = new BooleanCell(true);
      const string = new TextCell(DataType.String, "Hi");
      const cell = new ObjectCell(testSchema, {
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
      const cell = new ObjectCell(testSchema, {}, owner);
      const newOwner = new MockOwner();
      cell.owner = newOwner;
      const child = new BooleanCell(true);
      cell.row.boolean = child;
      expect(child.owner).to.equal(newOwner);
    });
  });

  describe("#row", () => {
    it("should uncache the owner when a child is added", () => {
      const owner = new MockOwner();
      const cell = new ObjectCell(testSchema, {}, owner);
      expect(owner.cached).to.be.true;
      cell.row.boolean = new BooleanCell(true);
      expect(owner.cached).to.be.false;
    });

    it("should set the owner of a child that is added", () => {
      const owner = new MockOwner();
      const cell = new ObjectCell(testSchema, {}, owner);
      const child = new BooleanCell(true);
      expect(child.owner).to.be.undefined;
      cell.row.boolean = child;
      expect(child.owner).to.equal(owner);
    });

    it("should uncache the owner when a child is deleted", () => {
      const owner = new MockOwner();
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true)
      }, owner);
      expect(owner.cached).to.be.true;
      delete cell.row.boolean;
      expect(owner.cached).to.be.false;
    });

    it("should delete a child when the delete operator is used", () => {
      const owner = new MockOwner();
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true)
      }, owner);
      expect(cell.row.boolean).to.not.be.undefined;
      delete cell.row.boolean;
      expect(cell.row.boolean).to.be.undefined;
    });

    it("should uncache the owner when a child is mutated", () => {
      const owner = new MockOwner();
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true)
      }, owner);
      expect(owner.cached).to.be.true;
      (cell.row.boolean as BooleanCell).value = false
      expect(owner.cached).to.be.false;
    });

    it("should uncache the owner when a child is set", () => {
      const owner = new MockOwner();
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true)
      }, owner);
      expect(owner.cached).to.be.true;
      cell.row.boolean = new BooleanCell(false);
      expect(owner.cached).to.be.false;
    });

    it("should uncache the owner when a child is set to undefined", () => {
      const owner = new MockOwner();
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true)
      }, owner);
      expect(owner.cached).to.be.true;
      cell.row.boolean = undefined;
      expect(owner.cached).to.be.false;
    });

    it("should uncache the owner when a child is set to null", () => {
      const owner = new MockOwner();
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true)
      }, owner);
      expect(owner.cached).to.be.true;
      cell.row.boolean = null;
      expect(owner.cached).to.be.false;
    });

    it("should set the owner of a child that is set", () => {
      const owner = new MockOwner();
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true)
      }, owner);
      const newChild = new BooleanCell(false);
      expect(newChild.owner).to.be.undefined;
      cell.row.boolean = newChild;
      expect(newChild.owner).to.equal(owner);
    });

    it("should not uncache the owner when a child is retrieved", () => {
      const owner = new MockOwner();
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true)
      }, owner);
      expect(owner.cached).to.be.true;
      const child = cell.row.boolean;
      expect(owner.cached).to.be.true;
    });
  });

  describe("#rowLength", () => {
    it("should return the number of children in this object", () => {
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true)
      });
      expect(cell.rowLength).to.equal(1);
    });

    it("should return the correct number after adding a child", () => {
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true)
      });
      cell.row.string = new TextCell(DataType.String, "Hi");
      expect(cell.rowLength).to.equal(2);
    });

    it("should return the correct number after deleting a child", () => {
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true)
      });
      delete cell.row.boolean;
      expect(cell.rowLength).to.equal(0);
    });
  });

  describe("#schemaLength", () => {
    it("should return the number of columns in this object's schema", () => {
      const cell = new ObjectCell(testSchema, {});
      expect(cell.schemaLength).to.equal(3);
    });
  });

  describe("#constructor", () => {
    it("should create a new object with the exact given schema", () => {
      const cell = new ObjectCell(testSchema, {});
      expect(cell.schema).to.equal(testSchema);
    });

    it("should set the owner of all given children", () => {
      const owner = new MockOwner()
      const boolean = new BooleanCell(true);
      const string = new TextCell(DataType.String, "Hi");
      const cell = new ObjectCell(testSchema, {
        boolean,
        string
      }, owner);
      expect(boolean.owner).to.equal(owner);
      expect(string.owner).to.equal(owner);
    });

    it("should contain the given children", () => {
      const boolean = new BooleanCell(true);
      const string = new TextCell(DataType.String, "Hi");
      const cell = new ObjectCell(testSchema, {
        boolean,
        string
      });
      expect(cell.row.boolean).to.equal(boolean);
      expect(cell.row.string).to.equal(string);
    });

    it("should use the owner that is given", () => {
      const owner = new MockOwner();
      const cell = new ObjectCell(testSchema, {}, owner);
      expect(cell.owner).to.equal(owner);
    });

    it("should not have an owner if one isn't given", () => {
      const cell = new ObjectCell(testSchema, {});
      expect(cell.owner).to.be.undefined;
    });
  });

  describe("#clone()", () => {
    it("should create a new cell with cloned child cells", () => {
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true)
      });
      const clone = cell.clone();
      expect(clone.rowLength).to.equal(1);
      expect(clone.row.boolean.dataType).to.equal(DataType.Boolean);
      expect(clone.row.boolean.asAny.value).to.be.true;
    });

    it("should not mutate the original", () => {
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true)
      });
      const clone = cell.clone();
      clone.row.string = new TextCell(DataType.String, "");
      expect(clone.rowLength).to.equal(2);
      expect(cell.rowLength).to.equal(1);
    });

    it("should not mutate the original children", () => {
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true)
      });
      const clone = cell.clone();
      clone.row.boolean.asAny.value = false;
      expect(clone.row.boolean.asAny.value).to.be.false;
      expect(cell.row.boolean.asAny.value).to.be.true;
    });

    it("should not clone the owner", () => {
      const owner = new MockOwner();
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true)
      }, owner);
      const clone = cell.clone();
      expect(clone.owner).to.be.undefined;
    });

    it("should not clone the owner of its new children", () => {
      const owner = new MockOwner();
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true)
      }, owner);
      const clone = cell.clone();
      expect(clone.row.boolean.owner).to.be.undefined;
    });

    it("should not create a new schema object if not told to", () => {
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true)
      });
      const clone = cell.clone();
      expect(cell.schema).to.equal(clone.schema);
    });

    it("should not create a new schema object for its children if not told to", () => {
      const cell = new ObjectCell(nestedObjectSchema, {
        obj: new ObjectCell(testSchema, {
          boolean: new BooleanCell(true)
        })
      });

      const clone = cell.clone();

      expect(clone.row.obj.asAny.schema).to.equal(testSchema);
    });

    it("should create a new schema object if told to", () => {
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true)
      });
      const clone = cell.clone({ cloneSchema: true });
      expect(cell.schema).to.not.equal(clone.schema);
    });

    it("should create a new schema object for its children if told to", () => {
      const cell = new ObjectCell(nestedObjectSchema, {
        obj: new ObjectCell(testSchema, {
          boolean: new BooleanCell(true)
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
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true),
        string: new TextCell(DataType.String, "Hi"),
        uint32: new NumberCell(DataType.UInt32, 15)
      });
      cell.encode(encoder, { offset: -5 });
      const decoder = encoder.getDecoder();
      expect(decoder.int32()).to.equal(-5);
    });

    it("should write the given (positive) offset", () => {
      const buffer = Buffer.alloc(4);
      const encoder = new BinaryEncoder(buffer);
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true),
        string: new TextCell(DataType.String, "Hi"),
        uint32: new NumberCell(DataType.UInt32, 15)
      });
      cell.encode(encoder, { offset: 5 });
      const decoder = encoder.getDecoder();
      expect(decoder.int32()).to.equal(5);
    });

    it("should throw if no offset is provided", () => {
      const encoder = new BinaryEncoder(Buffer.alloc(4));
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true),
        string: new TextCell(DataType.String, "Hi"),
        uint32: new NumberCell(DataType.UInt32, 15)
      });
      expect(() => cell.encode(encoder)).to.throw();
    });

    it("should throw if the object cell is invalid", () => {
      const encoder = new BinaryEncoder(Buffer.alloc(4));
      const cell = new ObjectCell(testSchema, {});
      expect(() => cell.encode(encoder, { offset: 5 })).to.throw();
    });

    it("should not throw if there is just an issue with cache validation", () => {
      const encoder = new BinaryEncoder(Buffer.alloc(4));
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true),
        string: new TextCell(DataType.String, "Hi"),
        uint32: new NumberCell(DataType.UInt32, 15)
      });
      cell.row.boolean.owner = new MockOwner();
      expect(() => cell.encode(encoder, { offset: 5 })).to.not.throw();
    });
  });

  describe("#equals()", () => {
    it("should return true when objects are the same", () => {
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true),
        uint32: new NumberCell(DataType.UInt32, 32),
        string: new TextCell(DataType.String, "hi")
      });

      const other = cell.clone();
      expect(cell.equals(other)).to.be.true;
    });

    it("should return true when the schema is a different object, but is equal", () => {
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true),
        uint32: new NumberCell(DataType.UInt32, 32),
        string: new TextCell(DataType.String, "hi")
      });

      const other = cell.clone({ cloneSchema: true });
      expect(cell.equals(other)).to.be.true;
    });

    it("should return false when the schema is different", () => {
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true),
        uint32: new NumberCell(DataType.UInt32, 32),
        string: new TextCell(DataType.String, "hi")
      });

      const other = cell.clone({ cloneSchema: true });
      other.schema.name = "NewName";
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when there is a different number of cells", () => {
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true),
        uint32: new NumberCell(DataType.UInt32, 32),
        string: new TextCell(DataType.String, "hi")
      });

      const other = cell.clone({ cloneSchema: true });
      delete other.row.boolean;
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when there is a different cell", () => {
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true),
        uint32: new NumberCell(DataType.UInt32, 32),
        string: new TextCell(DataType.String, "hi")
      });

      const other = cell.clone({ cloneSchema: true });
      other.row.boolean.asAny.value = false;
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when the other is undefined", () => {
      const cell = new ObjectCell(testSchema, {
        boolean: new BooleanCell(true),
        uint32: new NumberCell(DataType.UInt32, 32),
        string: new TextCell(DataType.String, "hi")
      });

      expect(cell.equals(undefined)).to.be.false;
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
      const cell = new ObjectCell(nestedObjectSchema, {
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
        new SimDataSchemaColumn("vector", DataType.Vector, 0)
      ]);

      const cell = new ObjectCell(vectorSchema, {
        vector: new VectorCell([new BooleanCell(true)])
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
        new SimDataSchemaColumn("variant", DataType.Variant, 0)
      ]);

      const cell = new ObjectCell(variantSchema, {
        variant: new VariantCell(0x1234, new BooleanCell(true))
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
      const cell = new ObjectCell(undefined, {});
      expect(() => cell.validate()).to.throw();
    });

    it("should throw if this object has less columns than its schema", () => {
      const cell = new ObjectCell(testSchema, {});
      expect(() => cell.validate()).to.throw();
    });

    it("should throw if this object has more columns than its schema", () => {
      const cell = newValidObjectCell();
      cell.row.variant = VariantCell.getDefault();
      expect(() => cell.validate()).to.throw();
    });

    it("should throw if this object has the right number of columns, but a type is different", () => {
      const cell = newValidObjectCell();
      cell.row.boolean = VariantCell.getDefault();
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
      const cell = ObjectCell.getDefault(testSchema);
      expect(cell.schema).to.equal(testSchema);
    });

    it("should have no children", () => {
      const cell = ObjectCell.getDefault(testSchema);
      expect(cell.rowLength).to.equal(0);
    });

    it("should not have an owner", () => {
      const cell = ObjectCell.getDefault(testSchema);
      expect(cell.owner).to.be.undefined;
    });

    it("should have the object data type", () => {
      const cell = ObjectCell.getDefault(testSchema);
      expect(cell.dataType).to.equal(DataType.Object);
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
      const cell = ObjectCell.fromXmlNode(node, [testSchema]);
      expect(cell.dataType).to.equal(DataType.Object);
      expect(cell.rowLength).to.equal(3);
      expect(cell.row.boolean?.asAny.value).to.equal(true);
      expect(cell.row.uint32?.asAny.value).to.equal(15);
      expect(cell.row.string?.asAny.value).to.equal("hi");
    });

    it("should contain a vector child if there is one", () => {
      const vectorSchema = new SimDataSchema("VectorSchema", 0x12, [
        new SimDataSchemaColumn("vector", DataType.Vector, 0)
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

      const cell = ObjectCell.fromXmlNode(node, [vectorSchema]);
      expect(cell.row.vector?.asAny.children[0].value).to.be.true;
    });

    it("should contain a variant child if there is one", () => {
      const variantSchema = new SimDataSchema("VariantSchema", 0x12, [
        new SimDataSchemaColumn("variant", DataType.Variant, 0)
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

      const cell = ObjectCell.fromXmlNode(node, [variantSchema]);
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

      const cell = ObjectCell.fromXmlNode(parent, [testSchema, nestedObjectSchema]);

      expect(cell.rowLength).to.equal(1);
      const child: ObjectCell = cell.row.obj.asAny;
      expect(child.rowLength).to.equal(3);
      expect(child.row.boolean?.asAny.value).to.equal(true);
      expect(child.row.uint32?.asAny.value).to.equal(15);
      expect(child.row.string?.asAny.value).to.equal("hi");
    });

    it("should throw if object doesn't use one of the supplied schemas", () => {
      expect(() => ObjectCell.fromXmlNode(node, [])).to.throw();
    });

    it("should throw if a child object doesn't use one of the supplied schemas", () => {
      const parent = new XmlElementNode({
        tag: "U",
        attributes: {
          schema: "NestedObject",
        },
        children: [ node ]
      });

      expect(() => ObjectCell.fromXmlNode(parent, [testSchema])).to.throw();
    });

    it("should throw if node is missing a column for its schema", () => {
      const clone = node.clone();
      clone.children.splice(0, 1);
      expect(() => ObjectCell.fromXmlNode(clone, [testSchema])).to.throw();
    });

    it("should throw if node has two of the same column", () => {
      const clone = node.clone();
      clone.addClones(clone.children[0]);
      expect(() => ObjectCell.fromXmlNode(clone, [testSchema])).to.throw();
    });
  });
});

describe("VectorCell", () => {
  describe("#children", () => {
    it("should uncache the owner when pushed", () => {
      const owner = new MockOwner();
      const cell = new VectorCell<BooleanCell>([], owner);
      expect(owner.cached).to.be.true;
      cell.children.push(new BooleanCell(true));
      expect(owner.cached).to.be.false;
    });

    it("should set the owner of a child that is pushed", () => {
      const owner = new MockOwner();
      const cell = new VectorCell<BooleanCell>([], owner);
      const child = new BooleanCell(true);
      cell.children.push(child);
      expect(child.owner).to.equal(owner);
    });

    it("should uncache the owner when spliced", () => {
      const owner = new MockOwner();
      const cell = new VectorCell<BooleanCell>([
        new BooleanCell(true)
      ], owner);
      expect(owner.cached).to.be.true;
      cell.children.splice(0, 1);
      expect(owner.cached).to.be.false;
    });

    it("should uncache the owner when a child is mutated", () => {
      const owner = new MockOwner();
      const cell = new VectorCell<BooleanCell>([
        new BooleanCell(true)
      ], owner);
      expect(owner.cached).to.be.true;
      cell.children[0].value = false;
      expect(owner.cached).to.be.false;
    });

    it("should uncache the owner when a child is set", () => {
      const owner = new MockOwner();
      const cell = new VectorCell<BooleanCell>([
        new BooleanCell(true)
      ], owner);
      expect(owner.cached).to.be.true;
      cell.children[0] = new BooleanCell(false);
      expect(owner.cached).to.be.false;
    });

    it("should set the owner of a child that is set", () => {
      const owner = new MockOwner();
      const cell = new VectorCell<BooleanCell>([
        new BooleanCell(true)
      ], owner);
      const child = new BooleanCell(false);
      cell.children[0] = child;
      expect(child.owner).to.equal(owner);
    });

    it("should not uncache the owner when a child is retrieved", () => {
      const owner = new MockOwner();
      const cell = new VectorCell<BooleanCell>([
        new BooleanCell(true)
      ], owner);
      expect(owner.cached).to.be.true;
      const child = cell.children[0];
      expect(owner.cached).to.be.true;
    });

    it("should uncache the owner when sorted", () => {
      const owner = new MockOwner();
      const cell = new VectorCell<NumberCell>([
        new NumberCell(DataType.UInt32, 2),
        new NumberCell(DataType.UInt32, 1)
      ], owner);
      expect(owner.cached).to.be.true;
      cell.children.sort((a, b) => a.value - b.value);
      expect(owner.cached).to.be.false;
    });
  });

  describe("#childType", () => {
    it("should return the data type of the first child", () => {
      const cell = new VectorCell<BooleanCell>([
        BooleanCell.getDefault()
      ]);
      expect(cell.childType).to.equal(DataType.Boolean);
    });

    it("should return undefined when there are no children", () => {
      const cell = VectorCell.getDefault();
      expect(cell.childType).to.be.undefined;
    });
  });

  describe("#length", () => {
    it("should return 0 when there are no children", () => {
      const cell = VectorCell.getDefault();
      expect(cell.length).to.equal(0);
    });

    it("should return the number of children in the array", () => {
      const cell = new VectorCell<BooleanCell>([
        BooleanCell.getDefault()
      ]);
      expect(cell.length).to.equal(1);
    });

    it("should return the correct number after adding a child", () => {
      const cell = new VectorCell<BooleanCell>([
        BooleanCell.getDefault()
      ]);
      cell.children.push(BooleanCell.getDefault());
      expect(cell.length).to.equal(2);
    });

    it("should return the correct number after deleting a child", () => {
      const cell = new VectorCell<BooleanCell>([
        BooleanCell.getDefault(),
        BooleanCell.getDefault()
      ]);
      cell.children.splice(0, 1);
      expect(cell.length).to.equal(1);
    });
  });

  describe("#owner", () => {
    it("should update the owner of all children when set", () => {
      const owner = new MockOwner();
      const child1 = BooleanCell.getDefault();
      const child2 = BooleanCell.getDefault();
      const cell = new VectorCell<BooleanCell>([
        child1,
        child2
      ], owner);
      const newOwner = new MockOwner();
      cell.owner = newOwner;
      expect(child1.owner).to.equal(newOwner);
      expect(child2.owner).to.equal(newOwner);
    });

    it("should use the new owner for new children after updating the owner", () => {
      const owner = new MockOwner();
      const cell = new VectorCell([], owner);
      const newOwner = new MockOwner();
      cell.owner = newOwner;
      const child = new BooleanCell(true);
      cell.children.push(child);
      expect(child.owner).to.equal(newOwner);
    });
  });

  describe("#constructor", () => {
    it("should set the owner of all given children", () => {
      const owner = new MockOwner();
      const child1 = BooleanCell.getDefault();
      const child2 = BooleanCell.getDefault();
      const cell = new VectorCell<BooleanCell>([
        child1,
        child2
      ], owner);
      expect(child1.owner).to.equal(owner);
      expect(child2.owner).to.equal(owner);
    });

    it("should contain the given children", () => {
      const child1 = BooleanCell.getDefault();
      const child2 = BooleanCell.getDefault();
      const cell = new VectorCell<BooleanCell>([
        child1,
        child2
      ]);
      expect(cell.children.length).to.equal(2);
      expect(cell.children[0]).to.equal(child1);
      expect(cell.children[1]).to.equal(child2);
    });

    it("should use the owner that is given", () => {
      const owner = new MockOwner();
      const cell = new VectorCell([], owner);
      expect(cell.owner).to.equal(owner);
    });

    it("should not have an owner if one isn't given", () => {
      const cell = new VectorCell([]);
      expect(cell.owner).to.be.undefined;
    });
  });

  describe("#addClones()", () => {
    it("should add the given children", () => {
      const cell = VectorCell.getDefault<BooleanCell>();
      cell.addClones(new BooleanCell(true));
      expect(cell.length).to.equal(1);
      expect(cell.children[0].value).to.be.true;
    });

    it("should not mutate the original children (they should be clones)", () => {
      const cell = VectorCell.getDefault<BooleanCell>();
      const child = new BooleanCell(true);
      cell.addClones(child);
      const childClone = cell.children[0];
      expect(childClone).to.not.equal(child);
      childClone.value = false;
      expect(childClone.value).to.be.false;
      expect(child.value).to.be.true;
    }); 
  
    it("should uncache the owner", () => {
      const owner = new MockOwner();
      const cell = new VectorCell([], owner);
      expect(owner.cached).to.be.true;
      cell.addClones(new BooleanCell(true));
      expect(owner.cached).to.be.false;
    });

    it("should set the owner of the clones", () => {
      const owner = new MockOwner();
      const cell = new VectorCell([], owner);
      cell.addClones(new BooleanCell(true));
      expect(cell.children[0].owner).to.equal(owner);
    });

    it("should not change the owner of the cell that is given", () => {
      const vectorOwner = new MockOwner();
      const booleanOwner = new MockOwner();
      const cell = new VectorCell([], vectorOwner);
      const child = new BooleanCell(true, booleanOwner);
      cell.addClones(child);
      expect(child.owner).to.equal(booleanOwner);
    });
  });

  describe("#removeChildren()", () => {
    it("should remove the one child that is given", () => {
      const childToRemove = BooleanCell.getDefault();
      const cell = new VectorCell([
        childToRemove
      ]);
      cell.removeChildren(childToRemove);
      expect(cell.children).to.be.empty;
    });

    it("should remove the children that are given", () => {
      const childToRemove1 = new BooleanCell(true);
      const childToRemove2 = new BooleanCell(false);
      const cell = new VectorCell([
        childToRemove1,
        childToRemove2
      ]);
      cell.removeChildren(childToRemove1, childToRemove2);
      expect(cell.children).to.be.empty;
    });

    it("should do nothing if a child that doesn't belong to this vector is given", () => {
      const childToRemove = new BooleanCell(true);
      const cell = new VectorCell([
        new BooleanCell(false)
      ]);
      cell.removeChildren(childToRemove);
      expect(cell.length).to.equal(1);
    });

    it("should only remove the first child if this vector contains two of the same object", () => {
      const childToRemove = new BooleanCell(true);
      const cell = new VectorCell([
        childToRemove,
        childToRemove
      ]);
      cell.removeChildren(childToRemove);
      expect(cell.length).to.equal(1);
    });

    it("should not remove any children that are not given", () => {
      const childToRemove2 = new BooleanCell(false);
      const cell = new VectorCell([
        new BooleanCell(true),
        childToRemove2
      ]);
      cell.removeChildren(childToRemove2);
      expect(cell.length).to.equal(1);
      expect(cell.children[0].value).to.be.true;
    });

    it("should not remove an identical, but different, cell that it contains", () => {
      const childToRemove = new BooleanCell(true);
      const cell = new VectorCell([
        new BooleanCell(true)
      ]);
      cell.removeChildren(childToRemove);
      expect(cell.length).to.equal(1);
    });

    it("should uncache the owner if at least one child is removed", () => {
      const owner = new MockOwner();
      const childToRemove = new BooleanCell(true);
      const cell = new VectorCell([
        childToRemove
      ], owner);
      expect(owner.cached).to.be.true;
      cell.removeChildren(childToRemove);
      expect(owner.cached).to.be.false;
    });

    it("should not uncache the owner if no children are removed", () => {
      const owner = new MockOwner();
      const childToRemove = new BooleanCell(true);
      const cell = new VectorCell([
        new BooleanCell(false)
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
      const cell = new VectorCell([]);
      expect(() => cell.encode(encoder)).to.throw();
    });

    it("should throw if the vector is invalid", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new VectorCell([
        BooleanCell.getDefault(),
        NumberCell.getDefault(DataType.UInt32)
      ]);
      expect(() => cell.encode(encoder, { offset: 4 })).to.throw();
    });

    it("should write the offset and correct number of children (0) if given and valid", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new VectorCell([]);
      cell.encode(encoder, { offset: 10 });
      const decoder = encoder.getDecoder();
      expect(decoder.int32()).to.equal(10);
      expect(decoder.uint32()).to.equal(0);
    });

    it("should write the offset and correct number of children (1) if given and valid", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new VectorCell([
        BooleanCell.getDefault()
      ]);
      cell.encode(encoder, { offset: 10 });
      const decoder = encoder.getDecoder();
      expect(decoder.int32()).to.equal(10);
      expect(decoder.uint32()).to.equal(1);
    });

    it("should write the offset and correct number of children (2+) if given and valid", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new VectorCell([
        BooleanCell.getDefault(),
        BooleanCell.getDefault()
      ]);
      cell.encode(encoder, { offset: 10 });
      const decoder = encoder.getDecoder();
      expect(decoder.int32()).to.equal(10);
      expect(decoder.uint32()).to.equal(2);
    });

    it("should write a negative offset", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new VectorCell([
        BooleanCell.getDefault(),
        BooleanCell.getDefault()
      ]);
      cell.encode(encoder, { offset: -10 });
      const decoder = encoder.getDecoder();
      expect(decoder.int32()).to.equal(-10);
      expect(decoder.uint32()).to.equal(2);
    });
  });

  describe("#equals()", () => {
    it("should return true when vectors are the same", () => {
      const cell = new VectorCell<BooleanCell>([
        new BooleanCell(true),
        new BooleanCell(false),
      ]);

      expect(cell.equals(cell.clone())).to.be.true;
    });

    it("should return false when there is a different number of children", () => {
      const cell = new VectorCell<BooleanCell>([
        new BooleanCell(true),
        new BooleanCell(false),
      ]);

      const other = cell.clone();
      other.children.push(new BooleanCell(false));
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when there is a different child", () => {
      const cell = new VectorCell<BooleanCell>([
        new BooleanCell(true),
        new BooleanCell(false),
      ]);

      const other = cell.clone();
      other.children[1].value = true;
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when the other is undefined", () => {
      const cell = new VectorCell<BooleanCell>([
        new BooleanCell(true),
        new BooleanCell(false),
      ]);

      expect(cell.equals(undefined)).to.be.false;
    });
  });

  describe("#toXmlNode()", () => {
    it("should use an L tag", () => {
      const cell = VectorCell.getDefault();
      const node = cell.toXmlNode();
      expect(node.tag).to.equal("L");
    });

    it("should write the name that is given", () => {
      const cell = VectorCell.getDefault();
      const node = cell.toXmlNode({ nameAttr: "vector" });
      expect(node.attributes.name).to.equal("vector");
      expect(node.toXml()).to.equal(`<L name="vector"/>`);
    });

    it("should write its type if told to", () => {
      const cell = VectorCell.getDefault();
      const node = cell.toXmlNode({ typeAttr: true });
      expect(node.attributes.type).to.equal("Vector");
      expect(node.toXml()).to.equal(`<L type="Vector"/>`);
    });

    it("should be empty if there are no children", () => {
      const cell = VectorCell.getDefault();
      const node = cell.toXmlNode();
      expect(node.children).to.be.an('Array').that.is.empty;
      expect(node.toXml()).to.equal(`<L/>`);
    });

    it("should contain its children and write their types", () => {
      const cell = new VectorCell([
        new BooleanCell(true),
        new BooleanCell(false),
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
      const cell = new VectorCell([
        new BooleanCell(true),
        new NumberCell(DataType.UInt32, 15)
      ]);

      expect(() => cell.validate()).to.throw();
    });

    it("should throw if this vector is valid, but one of its children isn't", () => {
      const cell = new VectorCell([
        new NumberCell(DataType.UInt32, 15),
        new NumberCell(DataType.UInt32, -15)
      ]);

      expect(() => cell.validate()).to.throw();
    });

    it("should not throw if this vector and all of its children are valid", () => {
      const cell = new VectorCell([
        new NumberCell(DataType.UInt32, 15),
        new NumberCell(DataType.UInt32, 15)
      ]);

      expect(() => cell.validate()).to.not.throw();
    });

    it("should throw if one of this vector's children has a different owner and ignoreCache is false", () => {
      const child = BooleanCell.getDefault();
      const owner = new MockOwner();
      const cell = new VectorCell([ child ], owner);
      child.owner = new MockOwner();
      expect(() => cell.validate({ ignoreCache: false })).to.throw();
    });

    it("should not throw if one of this vector's children has a different owner and ignoreCache is true", () => {
      const child = BooleanCell.getDefault();
      const owner = new MockOwner();
      const cell = new VectorCell([ child ], owner);
      child.owner = new MockOwner();
      expect(() => cell.validate({ ignoreCache: true })).to.not.throw();
    });
  });

  describe("static#getDefault()", () => {
    it("should have a type of Vector", () => {
      const cell = VectorCell.getDefault();
      expect(cell.dataType).to.equal(DataType.Vector);
    });

    it("should not have an owner", () => {
      const cell = VectorCell.getDefault();
      expect(cell.owner).to.be.undefined;
    });

    it("should have an empty array of children", () => {
      const cell = VectorCell.getDefault();
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
      expect(() => VectorCell.fromXmlNode(node)).to.throw();
    });

    it("should throw if other child doesn't specify its type", () => {
      const node = validNode.clone();
      delete node.children[1].attributes.type;
      expect(() => VectorCell.fromXmlNode(node)).to.throw();
    });

    it("should throw if two children have mismatched types", () => {
      const node = validNode.clone();
      node.children[1].attributes.type = "Single";
      node.children[1].innerValue = 1.5;
      expect(() => VectorCell.fromXmlNode(node)).to.throw();
    });

    it("should read children correctly", () => {
      const cell = VectorCell.fromXmlNode<BooleanCell>(validNode);
      expect(cell.children).to.have.lengthOf(2);
      const [ child1, child2 ] = cell.children;
      expect(child1.dataType).to.equal(DataType.Boolean);
      expect(child1.value).to.be.true;
      expect(child2.dataType).to.equal(DataType.Boolean);
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

      const cell = VectorCell.fromXmlNode<VectorCell<NumberCell>>(node);
      expect(cell.childType).to.equal(DataType.Vector);
      expect(cell.length).to.equal(1);
      const single = cell.children[0].children[0];
      expect(single.dataType).to.equal(DataType.Float);
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

      const cell = VectorCell.fromXmlNode<VariantCell<NumberCell>>(node);
      expect(cell.childType).to.equal(DataType.Variant);
      expect(cell.length).to.equal(1);
      const single = cell.children[0].child;
      expect(single.dataType).to.equal(DataType.Float);
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

      const cell = VectorCell.fromXmlNode<ObjectCell>(node, [testSchema]);
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

      expect(() => VectorCell.fromXmlNode(node)).to.throw();
    });

    it("should not have an owner", () => {
      const cell = VectorCell.fromXmlNode(validNode);
      expect(cell.owner).to.be.undefined;
    });

    it("should not set the owner of its children", () => {
      const cell = VectorCell.fromXmlNode(validNode);
      cell.children.forEach(child => {
        expect(child.owner).to.be.undefined;
      });
    });
  });
});

describe("VariantCell", () => {
  describe("#child", () => {
    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const cell = new VariantCell(0, BooleanCell.getDefault(), owner);
      expect(owner.cached).to.be.true;
      cell.child = cell.child.clone();
      expect(owner.cached).to.be.false;
    });

    it("should set the owner of the child that is set", () => {
      const owner = new MockOwner();
      const cell = new VariantCell(0, BooleanCell.getDefault(), owner);
      const newChild = cell.child.clone();
      expect(newChild.owner).to.be.undefined;
      cell.child = newChild;
      expect(newChild.owner).to.equal(owner);
    });

    it("should uncache the owner when mutated", () => {
      const owner = new MockOwner();
      const cell = new VariantCell(0, BooleanCell.getDefault(), owner);
      expect(owner.cached).to.be.true;
      cell.child.value = false;
      expect(owner.cached).to.be.false;
    });

    it("should uncache the owner when deleted", () => {
      const owner = new MockOwner();
      const cell = new VariantCell(0, BooleanCell.getDefault(), owner);
      expect(owner.cached).to.be.true;
      delete cell.child;
      expect(owner.cached).to.be.false;
    });

    it("should not uncache the owner when retrieved", () => {
      const owner = new MockOwner();
      const cell = new VariantCell(0, BooleanCell.getDefault(), owner);
      expect(owner.cached).to.be.true;
      const child = cell.child;
      expect(owner.cached).to.be.true;
    });
  });

  describe("#childType", () => {
    it("should be undefined if there is no child", () => {
      const cell = VariantCell.getDefault();
      expect(cell.childType).to.be.undefined;
    });

    it("should be the data type of the child", () => {
      const cell = new VariantCell(0, BooleanCell.getDefault());
      expect(cell.childType).to.equal(DataType.Boolean);
    });
  });

  describe("#owner", () => {
    it("should update the owner of the child when set", () => {
      const owner = new MockOwner();
      const cell = new VariantCell(0, BooleanCell.getDefault(), owner);
      const newOwner = new MockOwner();
      cell.owner = newOwner;
      expect(cell.child.owner).to.equal(newOwner);
    });
  });

  describe("#typeHash", () => {
    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const cell = new VariantCell(0, undefined, owner);
      expect(owner.cached).to.be.true;
      cell.typeHash = 0x1234;
      expect(owner.cached).to.be.false;
    });
  });

  describe("#constructor", () => {
    it("should have the given type hash", () => {
      const cell = new VariantCell(0x1234, undefined);
      expect(cell.typeHash).to.equal(0x1234);
    });

    it("should set the owner of the given child", () => {
      const owner = new MockOwner();
      const child = BooleanCell.getDefault();
      expect(child.owner).to.be.undefined;
      const cell = new VariantCell(0, child, owner);
      expect(child.owner).to.equal(owner);
    });

    it("should contain the given child", () => {
      const child = BooleanCell.getDefault();
      const cell = new VariantCell(0, child);
      expect(cell.child).to.equal(child);
    });

    it("should use the owner that is given", () => {
      const owner = new MockOwner();
      const cell = new VariantCell(0, undefined, owner);
      expect(cell.owner).to.equal(owner);
    });

    it("should not have an owner if one isn't given", () => {
      const cell = new VariantCell(0, undefined);
      expect(cell.owner).to.be.undefined;
    });

    it("should not set the owner of the child if one isn't given", () => {
      const child = BooleanCell.getDefault();
      const cell = new VariantCell(0, child);
      expect(child.owner).to.be.undefined;
    });
  });

  describe("#clone()", () => {
    it("should not mutate the original", () => {
      const owner = new MockOwner();
      const child = BooleanCell.getDefault();
      const cell = new VariantCell(0, child, owner);
      const clone = cell.clone();
      clone.typeHash = 0x1234;
      expect(cell.typeHash).to.equal(0);
    });

    it("should not mutate the child of the original", () => {
      const owner = new MockOwner();
      const child = BooleanCell.getDefault();
      const cell = new VariantCell(0, child, owner);
      const clone = cell.clone();
      clone.child.asAny.value = false;
      expect(child.value).to.be.false;
    });

    it("should copy the type hash", () => {
      const owner = new MockOwner();
      const child = BooleanCell.getDefault();
      const cell = new VariantCell(0x12, child, owner);
      const clone = cell.clone();
      expect(clone.typeHash).to.equal(0x12);
    });

    it("should copy the child", () => {
      const owner = new MockOwner();
      const child = BooleanCell.getDefault();
      const cell = new VariantCell(0x12, child, owner);
      const clone = cell.clone();
      expect(clone.child.dataType).to.equal(DataType.Boolean);
      expect(clone.child.asAny.value).to.be.false;
    });

    it("should not copy the owner", () => {
      const owner = new MockOwner();
      const child = BooleanCell.getDefault();
      const cell = new VariantCell(0x12, child, owner);
      const clone = cell.clone();
      expect(clone.owner).to.be.undefined;
    });

    it("should not copy the owner of the child", () => {
      const owner = new MockOwner();
      const child = BooleanCell.getDefault();
      const cell = new VariantCell(0x12, child, owner);
      const clone = cell.clone();
      expect(clone.child.owner).to.be.undefined;
    });
  });

  describe("#encode()", () => {
    it("should throw if no offset is provided", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = VariantCell.getDefault();
      expect(() => cell.encode(encoder)).to.throw();
    });

    it("should throw if the variant is invalid", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new VariantCell(-0x1234, undefined);
      expect(() => cell.encode(encoder, { offset: 4 })).to.throw();
    });

    it("should write the (positive) offset and type hash", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new VariantCell(0x1234, undefined);
      cell.encode(encoder, { offset: 10 });
      const decoder = encoder.getDecoder();
      expect(decoder.int32()).to.equal(10);
      expect(decoder.uint32()).to.equal(0x1234);
    });

    it("should write the (negative) offset and type hash", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new VariantCell(0x1234, undefined);
      cell.encode(encoder, { offset: -10 });
      const decoder = encoder.getDecoder();
      expect(decoder.int32()).to.equal(-10);
      expect(decoder.uint32()).to.equal(0x1234);
    });
  });

  describe("#equals()", () => {
    it("should return true when variants are the same", () => {
      const cell = new VariantCell<BooleanCell>(0x12, new BooleanCell(true));
      expect(cell.equals(cell.clone())).to.be.true;
    });

    it("should return false when there is a different type hash", () => {
      const cell = new VariantCell<BooleanCell>(0x12, new BooleanCell(true));
      const other = cell.clone();
      other.typeHash = 0x23;
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when there is a different child", () => {
      const cell = new VariantCell<BooleanCell>(0x12, new BooleanCell(true));
      const other = cell.clone();
      other.child.asAny.value = false;
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when the other is undefined", () => {
      const cell = new VariantCell<BooleanCell>(0x12, new BooleanCell(true));
      expect(cell.equals(undefined)).to.be.false;
    });
  });

  describe("#toXmlNode()", () => {
    it("should use a V tag", () => {
      const cell = VariantCell.getDefault();
      const node = cell.toXmlNode();
      expect(node.tag).to.equal("V");
    });

    it("should write the variant type hash in hex", () => {
      const cell = new VariantCell(0x00001234, undefined);
      const node = cell.toXmlNode();
      expect(node.attributes.variant).to.equal("0x00001234");
      expect(node.toXml()).to.equal(`<V variant="0x00001234"/>`);
    });

    it("should write the name that is given", () => {
      const cell = VariantCell.getDefault();
      const node = cell.toXmlNode({ nameAttr: "variant" });
      expect(node.attributes.name).to.equal("variant");
      expect(node.toXml()).to.equal(`<V name="variant" variant="0x00000000"/>`);
    });

    it("should write its type if told to", () => {
      const cell = VariantCell.getDefault();
      const node = cell.toXmlNode({ typeAttr: true });
      expect(node.attributes.type).to.equal("Variant");
      expect(node.toXml()).to.equal(`<V type="Variant" variant="0x00000000"/>`);
    });

    it("should be empty if there is no child", () => {
      const cell = VariantCell.getDefault();
      const node = cell.toXmlNode();
      expect(node.toXml()).to.equal(`<V variant="0x00000000"/>`);
    });

    it("should contain its child and write its type", () => {
      const cell = new VariantCell(0x1234, new BooleanCell(true));
      const node = cell.toXmlNode();
      expect(node.children).to.have.lengthOf(1);
      expect(node.child.attributes.type).to.equal("Boolean");
      expect(node.toXml()).to.equal(`<V variant="0x00001234">
  <T type="Boolean">1</T>
</V>`);
    });

    it("should write object child without a U tag", () => {
      const child = new ObjectCell(testSchema, {
        boolean: BooleanCell.getDefault(),
        uint32: NumberCell.getDefault(DataType.UInt32),
        string: TextCell.getDefault(DataType.String)
      });

      const cell = new VariantCell(0x1234, child);
      const node = cell.toXmlNode();
      expect(node.toXml()).to.equal(`<V variant="0x00001234" schema="TestSchema">
  <T name="boolean">0</T>
  <T name="uint32">0</T>
  <T name="string"></T>
</V>`);
    });
  });

  describe("#validate()", () => {
    it("should throw if this variant is valid, but its child isn't", () => {
      const cell = new VariantCell(0, new NumberCell(DataType.UInt32, -15));
      expect(() => cell.validate()).to.throw();
    });

    it("should not throw if this variant and its child are valid", () => {
      const cell = new VariantCell(0, new NumberCell(DataType.UInt32, 15));
      expect(() => cell.validate()).to.not.throw();
    });

    it("should throw if this variant's type hash is undefined", () => {
      const cell = new VariantCell(undefined, undefined);
      expect(() => cell.validate()).to.throw();
    });

    it("should throw if this variant's type hash is negative", () => {
      const cell = new VariantCell(-1, undefined);
      expect(() => cell.validate()).to.throw();
    });

    it("should throw if this variant's type hash is larger than 32 bit", () => {
      const cell = new VariantCell(0xFFFF_FFFF_F, undefined);
      expect(() => cell.validate()).to.throw();
    });

    it("should not throw if this variant's child is undefined", () => {
      const cell = new VariantCell(0x1234, undefined);
      expect(() => cell.validate()).to.not.throw();
    });

    it("should throw if the child's owner is different and ignoreCache is false", () => {
      const owner = new MockOwner();
      const cell = new VariantCell(0, new NumberCell(DataType.UInt32, 15), owner);
      cell.child.owner = new MockOwner();
      expect(() => cell.validate({ ignoreCache: false })).to.throw();
    });

    it("should not throw if the child's owner is different and ignoreCache is true", () => {
      const owner = new MockOwner();
      const cell = new VariantCell(0, new NumberCell(DataType.UInt32, 15), owner);
      cell.child.owner = new MockOwner();
      expect(() => cell.validate({ ignoreCache: true })).to.not.throw();
    });
  });

  describe("static#getDefault()", () => {
    it("should have a type of Variant", () => {
      const cell = VariantCell.getDefault();
      expect(cell.dataType).to.equal(DataType.Variant);
    });

    it("should not have an owner", () => {
      const cell = VariantCell.getDefault();
      expect(cell.owner).to.be.undefined;
    });

    it("should not have a child", () => {
      const cell = VariantCell.getDefault();
      expect(cell.child).to.be.undefined;
    });

    it("should have a type hash of 0", () => {
      const cell = VariantCell.getDefault();
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
      expect(() => VariantCell.fromXmlNode(node)).to.throw();
    });

    it("should read primitive child correctly", () => {
      const cell = VariantCell.fromXmlNode<BooleanCell>(validNode);
      expect(cell.child.dataType).to.equal(DataType.Boolean);
      expect(cell.child.value).to.be.true;
    });

    it("should read vector child correctly", () => {
      const node = new XmlElementNode({
        tag: "V",
        attributes: {
          variant: "0x12345678"
        },
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
                  type: "Boolean"
                },
                children: [
                  new XmlValueNode(true)
                ]
              })
            ]
          })
        ]
      });

      const cell = VariantCell.fromXmlNode<VectorCell<BooleanCell>>(node);
      expect(cell.typeHash).to.equal(0x12345678);
      expect(cell.child.length).to.equal(1);
      expect(cell.child.children[0].dataType).to.equal(DataType.Boolean);
      expect(cell.child.children[0].value).to.be.true;
    });

    it("should read variant child correctly", () => {
      const child = validNode.clone();
      child.attributes.type = "Variant";
      const node = new XmlElementNode({
        tag: "V",
        attributes: {
          variant: "0x00001234"
        },
        children: [
          child
        ]
      });

      const cell = VariantCell.fromXmlNode<VariantCell<BooleanCell>>(node);
      expect(cell.typeHash).to.equal(0x00001234);
      expect(cell.child.typeHash).to.equal(0x12345678);
      expect(cell.child.child.dataType).to.equal(DataType.Boolean);
      expect(cell.child.child.value).to.equal(true);
    });

    it("should read object child correctly, if its schema is provided", () => {
      const node = new XmlElementNode({
        tag: "V",
        attributes: {
          variant: "0x12345678",
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

      const cell = VariantCell.fromXmlNode<ObjectCell>(node, [testSchema]);
      expect(cell.child.rowLength).to.equal(3);
      expect(cell.child.row.boolean.asAny.value).to.equal(true);
      expect(cell.child.row.uint32.asAny.value).to.equal(15);
      expect(cell.child.row.string.asAny.value).to.equal("hi");
    });

    it("should throw if child is an object but its schema wasn't provided", () => {
      const node = new XmlElementNode({
        tag: "V",
        attributes: {
          variant: "0x12345678",
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

      expect(() => VariantCell.fromXmlNode(node)).to.throw();
    });

    it("should not have an owner", () => {
      const cell = VariantCell.fromXmlNode(validNode);
      expect(cell.owner).to.be.undefined;
    });

    it("should not set the owner of its child", () => {
      const cell = VariantCell.fromXmlNode(validNode);
      expect(cell.child.owner).to.be.undefined;
    });
  });
});

//#endregion Tests
