import { expect } from "chai";
import { DataType } from "../../../../dst/enums";
import { BooleanCell, NumberCell, BigIntCell, ResourceKeyCell, Float2Cell, Float3Cell, Float4Cell, TextCell, VariantCell } from "../../../../dst/simdata";
import * as hashing from "@s4tk/hashing";
import { BinaryDecoder, BinaryEncoder } from "@s4tk/encoding";
import * as xmlDom from "@s4tk/xml-dom";
import MockOwner from "../../../mocks/mock-owner";

const { fnv32 } = hashing;

//#region Helpers

function getPlainNode(value: any): xmlDom.XmlElementNode {
  return new xmlDom.XmlElementNode({
    tag: "T",
    children: [
      new xmlDom.XmlValueNode(value)
    ]
  });
}

//#endregion Helpers

//#region Tests

describe("Cell", function() {
  describe("#asAny", () => {
    it("should return the exact object", () => {
      const cell = new BooleanCell(true);
      expect(cell.asAny).to.equal(cell);
    });
  });

  describe("static#parseXmlNode()", function() {
    // NOTE: covered by other tests, since this function is used recursively -
    // these tests are a nice-to-have
  });
});

describe("BooleanCell", function() {
  describe("#value", () => {
    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const cell = new BooleanCell(true, owner);
      expect(owner.cached).to.be.true;
      cell.value = false;
      expect(owner.cached).to.be.false;
    });

    it("should change the value when set", () => {
      const cell = new BooleanCell(true);
      cell.value = false;
      expect(cell.value).to.be.false;
    });
  });

  describe("#constructor()", () => {
    it("should use the value that is given", () => {
      const cell = new BooleanCell(true);
      expect(cell.value).to.be.true;
    });

    it("should be false if given undefined", () => {
      const cell = new BooleanCell(undefined);
      expect(cell.value).to.be.false;
    });

    it("should be false if given null", () => {
      const cell = new BooleanCell(null);
      expect(cell.value).to.be.false;
    });

    it("should have an undefined owner is none is given", () => {
      const cell = new BooleanCell(true);
      expect(cell.owner).to.be.undefined;
    });

    it("should have an owner if one is given", () => {
      const owner = VariantCell.getDefault();
      const cell = new BooleanCell(true, owner);
      expect(cell.owner).to.equal(owner);
    });

    it("should have a data type of Boolean", () => {
      const cell = new BooleanCell(true);
      expect(cell.dataType).to.equal(DataType.Boolean);
    });
  });

  describe("#clone()", () => {
    it("should not mutate the original", () => {
      const cell = new BooleanCell(true);
      const clone = cell.clone();
      clone.value = false;
      expect(clone.value).to.be.false;
      expect(cell.value).to.be.true;
    });

    it("should not copy the owner", () => {
      const owner = new MockOwner();
      const cell = new BooleanCell(true, owner);
      const clone = cell.clone();
      expect(cell.owner).to.equal(owner);
      expect(clone.owner).to.be.undefined;
    });
  });

  describe("#equals()", () => {
    it("should return true when both have the same type and value", () => {
      const cell = new BooleanCell(true);
      expect(cell.equals(cell.clone())).to.be.true;
    });

    it("should return false when type is different", () => {
      const cell = new BooleanCell(true);
      const other = new Float2Cell(1, 1);
      //@ts-expect-error
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when value is different", () => {
      const cell = new BooleanCell(true);
      const other = new BooleanCell(false);
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when other is undefined", () => {
      const cell = new BooleanCell(true);
      expect(cell.equals(undefined)).to.be.false;
    });
  });

  describe("#encode()", () => {
    it("should write one byte", () => {
      const encoder = new BinaryEncoder(Buffer.alloc(1));
      const cell = new BooleanCell(true);
      expect(encoder.tell()).to.equal(0);
      cell.encode(encoder);
      expect(encoder.tell()).to.equal(1);
    });

    it("should write 0 for false", () => {
      const buffer = Buffer.alloc(1);
      const encoder = new BinaryEncoder(buffer);
      const cell = new BooleanCell(false);
      cell.encode(encoder);
      expect(buffer.readUInt8(0)).to.equal(0);
    });

    it("should write one byte", () => {
      const buffer = Buffer.alloc(1);
      const encoder = new BinaryEncoder(buffer);
      const cell = new BooleanCell(true);
      cell.encode(encoder);
      expect(buffer.readUInt8(0)).to.equal(1);
    });

    it("should throw if the value is undefined or null", () => {
      const cell = BooleanCell.getDefault();
      cell.value = undefined;
      const encoder = new BinaryEncoder(Buffer.alloc(4));
      expect(() => cell.encode(encoder)).to.throw();
    });
  });

  describe("#toXmlNode()", () => {
    it("should write 1 for true", () => {
      const cell = new BooleanCell(true);
      const node = cell.toXmlNode();
      expect(node.toXml()).to.equal(`<T>1</T>`);
    });

    it("should write 0 for false", () => {
      const cell = new BooleanCell(false);
      const node = cell.toXmlNode();
      expect(node.toXml()).to.equal(`<T>0</T>`);
    });

    it("should have a type attribute when option is true", () => {
      const cell = new BooleanCell(true);
      const node = cell.toXmlNode({ typeAttr: true });
      expect(node.toXml()).to.equal(`<T type="Boolean">1</T>`);
    });

    it("should use the name attribute when given", () => {
      const cell = new BooleanCell(true);
      const node = cell.toXmlNode({ nameAttr: "bool" });
      expect(node.toXml()).to.equal(`<T name="bool">1</T>`);
    });

    it("should use both attributes when given", () => {
      const cell = new BooleanCell(false);
      const node = cell.toXmlNode({ nameAttr: "bool", typeAttr: true });
      expect(node.toXml()).to.equal(`<T name="bool" type="Boolean">0</T>`);
    });
  });

  describe("#validate()", () => {
    it("should not throw when value is boolean", () => {
      const cell = new BooleanCell(true);
      expect(() => cell.validate()).to.not.throw();
    });

    it("should throw when value is undefined", () => {
      const cell = new BooleanCell(false);
      cell.value = undefined;
      expect(() => cell.validate()).to.throw();
    });

    it("should throw when value is null", () => {
      const cell = new BooleanCell(false);
      cell.value = undefined;
      expect(() => cell.validate()).to.throw();
    });
  });

  describe("static#decode()", () => {
    it("should read 1 as true", () => {
      const buffer = Buffer.alloc(1);
      const encoder = new BinaryEncoder(buffer);
      encoder.uint8(1);
      const decoder = new BinaryDecoder(buffer);
      const cell = BooleanCell.decode(decoder);
      expect(cell.value).to.be.true;
    });

    it("should read 0 as false", () => {
      const buffer = Buffer.alloc(1);
      const decoder = new BinaryDecoder(buffer);
      const cell = BooleanCell.decode(decoder);
      expect(cell.value).to.be.false;
    });
  });

  describe("static#fromXmlNode()", () => {
    it("should have a value of true when the node value is 1", () => {
      const cell = BooleanCell.fromXmlNode(getPlainNode(1));
      expect(cell.value).to.be.true;
    });

    it("should have a value of true when the node value is \"1\"", () => {
      const cell = BooleanCell.fromXmlNode(getPlainNode("1"));
      expect(cell.value).to.be.true;
    });

    it("should have a value of true when the node value is 1n", () => {
      const cell = BooleanCell.fromXmlNode(getPlainNode(1n));
      expect(cell.value).to.be.true;
    });

    it("should have a value of false when the node value is 0", () => {
      const cell = BooleanCell.fromXmlNode(getPlainNode(0));
      expect(cell.value).to.be.false;
    });

    it("should have a value of false when the node value is \"0\"", () => {
      const cell = BooleanCell.fromXmlNode(getPlainNode("0"));
      expect(cell.value).to.be.false;
    });

    it("should have a value of false when the node value is 0n", () => {
      const cell = BooleanCell.fromXmlNode(getPlainNode(0n));
      expect(cell.value).to.be.false;
    });

    it("should have a value of false when the node value is undefined", () => {
      const cell = BooleanCell.fromXmlNode(getPlainNode(undefined));
      expect(cell.value).to.be.false;
    });

    it("should have a value of false when the node value is null", () => {
      const cell = BooleanCell.fromXmlNode(getPlainNode(null));
      expect(cell.value).to.be.false;
    });
  });

  describe("static#getDefault()", () => {
    it("should create a cell with a false value", () => {
      const cell = BooleanCell.getDefault();
      expect(cell.value).to.be.false;
    });
  });
});

describe("TextCell", function() {
  describe("#value", () => {
    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const cell = new TextCell(DataType.String, "hi", owner);
      expect(owner.cached).to.be.true;
      cell.value = "bye";
      expect(owner.cached).to.be.false;
    });

    it("should change the value when set", () => {
      const cell = new TextCell(DataType.String, "hi");
      cell.value = "bye";
      expect(cell.value).to.equal("bye");
    });
  });

  describe("#constructor()", () => {
    it("should use the provided data type and value", () => {
      const cell = new TextCell(DataType.String, "Something");
      expect(cell.dataType).to.equal(DataType.String);
      expect(cell.value).to.equal("Something");
    });

    it("should be an empty string if given undefined", () => {
      const cell = new TextCell(DataType.String, undefined);
      expect(cell.value).to.equal("");
    });

    it("should be an empty string if given null", () => {
      const cell = new TextCell(DataType.String, null);
      expect(cell.value).to.equal("");
    });
  });

  describe("#clone()", () => {
    it("should copy the data type and value", () => {
      const cell = new TextCell(DataType.String, "Something");
      const clone = cell.clone();
      expect(clone.dataType).to.equal(DataType.String);
      expect(clone.value).to.equal("Something");
    });

    it("should not copy the owner", () => {
      const owner = new MockOwner();
      const cell = new TextCell(DataType.String, "Something", owner);
      const clone = cell.clone();
      expect(clone.owner).to.be.undefined;
    });

    it("should not mutate the original", () => {
      const cell = new TextCell(DataType.String, "Something");
      const clone = cell.clone();
      clone.value = "Something else";
      expect(cell.value).to.equal("Something");
    });
  });

  describe("#equals()", () => {
    it("should return true when both have the same type and value", () => {
      const cell = new TextCell(DataType.String, "hi");
      const other = new TextCell(DataType.String, "hi");
      expect(cell.equals(other)).to.be.true;
    });

    it("should return false when type is different", () => {
      const cell = new TextCell(DataType.String, "hi");
      const other = new TextCell(DataType.HashedString, "hi");
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when value is different", () => {
      const cell = new TextCell(DataType.String, "hi");
      const other = new TextCell(DataType.String, "bye");
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when other is undefined", () => {
      const cell = new TextCell(DataType.String, "hi");
      expect(cell.equals(undefined)).to.be.false;
    });
  });

  describe("#encode()", () => {
    context("data type === character", () => {
      it("should write 1 byte", () => {
        const cell = new TextCell(DataType.Character, "a");
        const encoder = new BinaryEncoder(Buffer.alloc(1));
        cell.encode(encoder);
        expect(encoder.tell()).to.equal(1);
      });

      it("should write the character that is contained", () => {
        const cell = new TextCell(DataType.Character, "x");
        const buffer = Buffer.alloc(1);
        const encoder = new BinaryEncoder(buffer);
        cell.encode(encoder);
        const decoder = new BinaryDecoder(buffer);
        expect(decoder.charsUtf8(1)).to.equal("x");
      });

      it("should throw if the byte length is > 1", () => {
        const cell = new TextCell(DataType.Character, "hello");
        const encoder = new BinaryEncoder(Buffer.alloc(5));
        expect(() => cell.encode(encoder)).to.throw();
      });
    });

    context("data type === string", () => {
      it("should write the (positive) offset that is provided", () => {
        const cell = new TextCell(DataType.String, "hi");
        const buffer = Buffer.alloc(4);
        const encoder = new BinaryEncoder(buffer)
        cell.encode(encoder, { offset: 32 });
        const decoder = new BinaryDecoder(buffer);
        expect(decoder.int32()).to.equal(32);
      });

      it("should write the (negative) offset that is provided", () => {
        const cell = new TextCell(DataType.String, "hi");
        const buffer = Buffer.alloc(4);
        const encoder = new BinaryEncoder(buffer)
        cell.encode(encoder, { offset: -32 });
        const decoder = new BinaryDecoder(buffer);
        expect(decoder.int32()).to.equal(-32);
      });

      it("should throw if no offset is provided", () => {
        const cell = new TextCell(DataType.String, "hi");
        const buffer = Buffer.alloc(4);
        const encoder = new BinaryEncoder(buffer)
        expect(() => cell.encode(encoder)).to.throw();
      });

      it("should throw if the value is undefined or null", () => {
        const cell = TextCell.getDefault(DataType.String);
        cell.value = undefined;
        const encoder = new BinaryEncoder(Buffer.alloc(4));
        expect(() => cell.encode(encoder)).to.throw();
      });
    });

    context("data type === hashed string", () => {
      it("should write the (positive) offset that is provided and the 32-bit hash of the string", () => {
        const cell = new TextCell(DataType.HashedString, "hi");
        const buffer = Buffer.alloc(8);
        const encoder = new BinaryEncoder(buffer)
        cell.encode(encoder, { offset: 32 });
        const decoder = new BinaryDecoder(buffer);
        expect(decoder.int32()).to.equal(32);
        expect(decoder.uint32()).to.equal(fnv32("hi"));
      });

      it("should write the (negative) offset that is provided and the 32-bit hash of the string", () => {
        const cell = new TextCell(DataType.HashedString, "hi");
        const buffer = Buffer.alloc(8);
        const encoder = new BinaryEncoder(buffer)
        cell.encode(encoder, { offset: -32 });
        const decoder = new BinaryDecoder(buffer);
        expect(decoder.int32()).to.equal(-32);
        expect(decoder.uint32()).to.equal(fnv32("hi"));
      });

      it("should throw if no offset is provided", () => {
        const cell = new TextCell(DataType.HashedString, "hi");
        const buffer = Buffer.alloc(8);
        const encoder = new BinaryEncoder(buffer)
        expect(() => cell.encode(encoder)).to.throw();
      });
    });
  });

  describe("#toXmlNode()", () => {
    it("should throw when writing a character with its type", () => {
      const cell = new TextCell(DataType.Character, "x");
      expect(() => cell.toXmlNode({ typeAttr: true })).to.throw();
    });

    it("should write the value of a string", () => {
      const cell = new TextCell(DataType.String, "b__Head__");
      const node = cell.toXmlNode();
      expect(node.toXml()).to.equal(`<T>b__Head__</T>`);
    });

    it("should write the value of a hashed string", () => {
      const cell = new TextCell(DataType.HashedString, "b__Head__");
      const node = cell.toXmlNode();
      expect(node.toXml()).to.equal(`<T>b__Head__</T>`);
    });

    it("should write the type of a string", () => {
      const cell = new TextCell(DataType.String, "b__Head__");
      const node = cell.toXmlNode({ typeAttr: true });
      expect(node.toXml()).to.equal(`<T type="String">b__Head__</T>`);
    });

    it("should write the type of a hashed string", () => {
      const cell = new TextCell(DataType.HashedString, "b__Head__");
      const node = cell.toXmlNode({ typeAttr: true });
      expect(node.toXml()).to.equal(`<T type="HashedString">b__Head__</T>`);
    });

    it("should write the given name", () => {
      const cell = new TextCell(DataType.String, "b__Head__");
      const node = cell.toXmlNode({ nameAttr: "str" });
      expect(node.toXml()).to.equal(`<T name="str">b__Head__</T>`);
    });
  });

  describe("#validate()", () => {
    context("data type === character", () => {
      it("should throw if the byte length is > 1", () => {
        const cell = new TextCell(DataType.Character, "hello");
        expect(() => cell.validate()).to.throw();
      });

      it("should throw if the byte length is < 1", () => {
        const cell = new TextCell(DataType.Character, "");
        expect(() => cell.validate()).to.throw();
      });

      it("should not throw if the byte length is = 1", () => {
        const cell = new TextCell(DataType.Character, "x");
        expect(() => cell.validate()).to.not.throw();
      });
    });

    context("data type === string/hashed string", () => {
      it("should not throw if string is non-empty", () => {
        const cell = new TextCell(DataType.String, "Hi");
        expect(() => cell.validate()).to.not.throw();
      });

      it("should not throw if string is empty", () => {
        const cell = new TextCell(DataType.String, "");
        expect(() => cell.validate()).to.not.throw();
      });
    });
  });

  describe("static#decode()", () => {
    context("data type === character", () => {
      it("should return a cell with a single character", () => {
        const char = "x";
        const buffer = Buffer.alloc(1);
        const encoder = new BinaryEncoder(buffer);
        encoder.charsUtf8(char);
        const decoder = new BinaryDecoder(buffer);
        const cell = TextCell.decode(DataType.Character, decoder);
        expect(cell.dataType).to.equal(DataType.Character);
        expect(cell.value).to.equal("x");
      });
    });

    context("data type === string", () => {
      it("should read a (positive) offset and then read the string at the offset", () => {
        const string = "hello";
        const buffer = Buffer.alloc(6 + Buffer.byteLength(string) + 1);
        const encoder = new BinaryEncoder(buffer);
        encoder.int32(6);
        encoder.skip(2);
        encoder.charsUtf8(string);
        const decoder = new BinaryDecoder(buffer);
        const cell = TextCell.decode(DataType.String, decoder);
        expect(cell.dataType).to.equal(DataType.String);
        expect(cell.value).to.equal(string);
      });

      it("should read a (negative) offset and then read the string at the offset", () => {
        const string = "hello";
        const stringSize = Buffer.byteLength(string) + 1;
        const buffer = Buffer.alloc(4 + stringSize);
        const encoder = new BinaryEncoder(buffer);
        encoder.charsUtf8(string);
        encoder.skip(1);
        encoder.int32(-stringSize);
        const decoder = new BinaryDecoder(buffer);
        decoder.seek(stringSize);
        const cell = TextCell.decode(DataType.String, decoder);
        expect(cell.dataType).to.equal(DataType.String);
        expect(cell.value).to.equal(string);
      });
    });

    context("data type === hashed string", () => {
      it("should read a (positive) offset, skip the hash, and then read the string at the offset", () => {
        const string = "hello";
        const buffer = Buffer.alloc(10 + Buffer.byteLength(string) + 1);
        const encoder = new BinaryEncoder(buffer);
        encoder.int32(10);
        encoder.uint32(fnv32(string));
        encoder.skip(2);
        encoder.charsUtf8(string);
        const decoder = new BinaryDecoder(buffer);
        const cell = TextCell.decode(DataType.HashedString, decoder);
        expect(cell.dataType).to.equal(DataType.HashedString);
        expect(cell.value).to.equal("hello");
      });

      it("should read a (negative) offset, skip the hash, and then read the string at the offset", () => {
        const string = "hello";
        const stringSize = Buffer.byteLength(string) + 1;
        const buffer = Buffer.alloc(8 + stringSize);
        const encoder = new BinaryEncoder(buffer);
        encoder.charsUtf8(string);
        encoder.skip(1);
        encoder.int32(-stringSize);
        encoder.uint32(fnv32(string));
        const decoder = new BinaryDecoder(buffer);
        decoder.seek(stringSize);
        const cell = TextCell.decode(DataType.HashedString, decoder);
        expect(cell.dataType).to.equal(DataType.HashedString);
        expect(cell.value).to.equal("hello");
      });
    });
  });

  describe("static#fromXmlNode()", () => {
    it("should create a cell with the given type and value", () => {
      const node = getPlainNode("hi");
      const cell = TextCell.fromXmlNode(DataType.String, node);
      expect(cell.dataType).to.equal(DataType.String);
      expect(cell.value).to.equal("hi");
      const hashedCell = TextCell.fromXmlNode(DataType.HashedString, node);
      expect(hashedCell.dataType).to.equal(DataType.HashedString);
      expect(hashedCell.value).to.equal("hi");
    });

    it("should create a cell with an empty string if the node contains undefined", () => {
      const node = getPlainNode(undefined);
      const cell = TextCell.fromXmlNode(DataType.String, node);
      expect(cell.value).to.equal("");
    });
  });

  describe("static#getDefault()", () => {
    it("should return a cell with the given data type and an empty string", () => {
      const cell = TextCell.getDefault(DataType.String);
      expect(cell.dataType).to.equal(DataType.String);
      expect(cell.value).to.equal("");
    });
  });
});

describe("NumberCell", function() {
  describe("#value", () => {
    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const cell = new NumberCell(DataType.UInt32, 100, owner);
      expect(owner.cached).to.be.true;
      cell.value = 50;
      expect(owner.cached).to.be.false;
    });
  });

  describe("#constructor()", () => {
    it("should have the given type and value", () => {
      const cell = new NumberCell(DataType.UInt32, 100);
      expect(cell.dataType).to.equal(DataType.UInt32);
      expect(cell.value).to.equal(100);
    });

    it("should have value of 0 if given undefined", () => {
      const cell = new NumberCell(DataType.UInt32, undefined);
      expect(cell.value).to.equal(0);
    });

    it("should have value of 0 if given null", () => {
      const cell = new NumberCell(DataType.UInt32, null);
      expect(cell.value).to.equal(0);
    });
  });

  describe("#clone()", () => {
    it("should copy the data type and value", () => {
      const cell = new NumberCell(DataType.Int8, 100);
      const clone = cell.clone();
      expect(clone.dataType).to.equal(DataType.Int8);
      expect(clone.value).to.equal(100);
    });

    it("should not copy the owner", () => {
      const owner = new MockOwner();
      const cell = new NumberCell(DataType.Int8, 100, owner);
      const clone = cell.clone();
      expect(clone.owner).to.be.undefined;
    });

    it("should not mutate the original", () => {
      const cell = new NumberCell(DataType.Int8, 100);
      const clone = cell.clone();
      clone.value = 50;
      expect(cell.value).to.equal(100);
    });
  });

  describe("#encode()", () => {
    it("should write Int8 in 1 byte", () => {
      const cell = new NumberCell(DataType.Int8, -5);
      const buffer = Buffer.alloc(1);
      const encoder = new BinaryEncoder(buffer);
      expect(() => cell.encode(encoder)).to.not.throw();
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.int8()).to.equal(-5);
    });

    it("should write UInt8 in 1 byte", () => {
      const cell = new NumberCell(DataType.UInt8, 5);
      const buffer = Buffer.alloc(1);
      const encoder = new BinaryEncoder(buffer);
      expect(() => cell.encode(encoder)).to.not.throw();
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.uint8()).to.equal(5);
    });

    it("should write Int16 in 2 bytes", () => {
      const cell = new NumberCell(DataType.Int16, -5);
      const buffer = Buffer.alloc(2);
      const encoder = new BinaryEncoder(buffer);
      expect(() => cell.encode(encoder)).to.not.throw();
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.int16()).to.equal(-5);
    });

    it("should write UInt16 in 2 bytes", () => {
      const cell = new NumberCell(DataType.UInt16, 5);
      const buffer = Buffer.alloc(2);
      const encoder = new BinaryEncoder(buffer);
      expect(() => cell.encode(encoder)).to.not.throw();
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.uint16()).to.equal(5);
    });

    it("should write Int32 in 4 bytes", () => {
      const cell = new NumberCell(DataType.Int32, -5);
      const buffer = Buffer.alloc(4);
      const encoder = new BinaryEncoder(buffer);
      expect(() => cell.encode(encoder)).to.not.throw();
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.int32()).to.equal(-5);
    });

    it("should write UInt32 in 4 bytes", () => {
      const cell = new NumberCell(DataType.UInt32, 5);
      const buffer = Buffer.alloc(4);
      const encoder = new BinaryEncoder(buffer);
      expect(() => cell.encode(encoder)).to.not.throw();
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.uint32()).to.equal(5);
    });

    it("should write LocalizationKey in 4 bytes", () => {
      const cell = new NumberCell(DataType.LocalizationKey, 0x12345678);
      const buffer = Buffer.alloc(4);
      const encoder = new BinaryEncoder(buffer);
      expect(() => cell.encode(encoder)).to.not.throw();
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.uint32()).to.equal(0x12345678);
    });

    it("should write Float in 4 bytes", () => {
      const cell = new NumberCell(DataType.Float, 1.75);
      const buffer = Buffer.alloc(4);
      const encoder = new BinaryEncoder(buffer);
      expect(() => cell.encode(encoder)).to.not.throw();
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.float()).to.equal(1.75);
    });

    it("should throw if value is out of bounds", () => {
      const cell = new NumberCell(DataType.UInt8, 500);
      const encoder = new BinaryEncoder(Buffer.alloc(1));
      expect(() => cell.encode(encoder)).to.throw();
    });

    it("should throw if an unsigned integer is negative", () => {
      const cell = new NumberCell(DataType.UInt32, -10);
      const encoder = new BinaryEncoder(Buffer.alloc(4));
      expect(() => cell.encode(encoder)).to.throw();
    });

    it("should throw if contains undefined", () => {
      const cell = NumberCell.getDefault(DataType.UInt32);
      cell.value = undefined;
      const encoder = new BinaryEncoder(Buffer.alloc(4));
      expect(() => cell.encode(encoder)).to.throw();
    });

    it("should throw if contains null", () => {
      const cell = NumberCell.getDefault(DataType.UInt32);
      cell.value = null;
      const encoder = new BinaryEncoder(Buffer.alloc(4));
      expect(() => cell.encode(encoder)).to.throw();
    });

    it("should throw if value is not a number", () => {
      const cell = NumberCell.getDefault(DataType.UInt32);
      //@ts-expect-error error is entire point of test
      cell.value = "hi";
      const encoder = new BinaryEncoder(Buffer.alloc(4));
      expect(() => cell.encode(encoder)).to.throw();
    });
  });

  describe("#equals()", () => {
    it("should return true when both have the same type and value", () => {
      const cell = new NumberCell(DataType.UInt32, 64);
      const other = new NumberCell(DataType.UInt32, 64);
      expect(cell.equals(other)).to.be.true;
    });

    it("should return false when type is different", () => {
      const cell = new NumberCell(DataType.UInt32, 64);
      const other = new NumberCell(DataType.Int32, 64);
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when value is different", () => {
      const cell = new NumberCell(DataType.UInt32, 64);
      const other = new NumberCell(DataType.UInt32, 32);
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when other is undefined", () => {
      const cell = new NumberCell(DataType.UInt32, 64);
      expect(cell.equals(undefined)).to.be.false;
    });
  });

  describe("#toXmlNode()", () => {
    it("should create a node that contains the value", () => {
      const cell = new NumberCell(DataType.UInt32, 25);
      const node = cell.toXmlNode();
      expect(node.toXml()).to.equal(`<T>25</T>`);
    });

    it("should have a type attribute when option is true", () => {
      const cell = new NumberCell(DataType.UInt32, 25);
      const node = cell.toXmlNode({ typeAttr: true });
      expect(node.toXml()).to.equal(`<T type="UInt32">25</T>`);
    });

    it("should use \"Single\" instead of \"Float\" for floats", () => {
      const cell = new NumberCell(DataType.Float, 25);
      const node = cell.toXmlNode({ typeAttr: true });
      expect(node.toXml()).to.equal(`<T type="Single">25</T>`);
    });

    it("should use the name attribute when given", () => {
      const cell = new NumberCell(DataType.UInt32, 25);
      const node = cell.toXmlNode({ nameAttr: "number" });
      expect(node.toXml()).to.equal(`<T name="number">25</T>`);
    });

    it("should use both attributes when given", () => {
      const cell = new NumberCell(DataType.UInt32, 25);
      const node = cell.toXmlNode({ nameAttr: "number", typeAttr: true });
      expect(node.toXml()).to.equal(`<T name="number" type="UInt32">25</T>`);
    });
  });

  describe("#validate()", () => {
    it("should throw when unsigned integer is larger than its limit", () => {
      const cell = new NumberCell(DataType.UInt8, 256);
      expect(() => cell.validate()).to.throw();
    });

    it("should throw when unsigned integer is negative", () => {
      const cell = new NumberCell(DataType.UInt8, -1);
      expect(() => cell.validate()).to.throw();
    });

    it("should not throw when unsigned integer is within range", () => {
      const cell = new NumberCell(DataType.UInt8, 255);
      expect(() => cell.validate()).to.not.throw();
    });

    it("should throw when signed integer is larger than its limit", () => {
      const cell = new NumberCell(DataType.Int8, 128);
      expect(() => cell.validate()).to.throw();
    });

    it("should throw when signed integer is lower than its limit", () => {
      const cell = new NumberCell(DataType.Int8, -129);
      expect(() => cell.validate()).to.throw();
    });

    it("should not throw when signed integer is negative and in range", () => {
      const cell = new NumberCell(DataType.Int8, -1);
      expect(() => cell.validate()).to.not.throw();
    });
  });

  describe("static#decode()", () => {
    function getDecoder(numBytes: number, type: string, value: number) {
      const buffer = Buffer.alloc(numBytes);
      const encoder = new BinaryEncoder(buffer);
      encoder[type](value);
      return new BinaryDecoder(buffer);
    }

    context("data type === 8 bits", () => {
      it("should read a signed integer", () => {
        const decoder = getDecoder(1, 'int8', -5);
        const cell = NumberCell.decode(DataType.Int8, decoder);
        expect(cell.dataType).to.equal(DataType.Int8);
        expect(cell.value).to.equal(-5);
      });

      it("should read an unsigned integer", () => {
        const decoder = getDecoder(1, 'uint8', 5);
        const cell = NumberCell.decode(DataType.UInt8, decoder);
        expect(cell.dataType).to.equal(DataType.UInt8);
        expect(cell.value).to.equal(5);
      });
    });

    context("data type === 16 bits", () => {
      it("should read a signed integer", () => {
        const decoder = getDecoder(2, 'int16', -5);
        const cell = NumberCell.decode(DataType.Int16, decoder);
        expect(cell.dataType).to.equal(DataType.Int16);
        expect(cell.value).to.equal(-5);
      });

      it("should read an unsigned integer", () => {
        const decoder = getDecoder(2, 'uint16', 5);
        const cell = NumberCell.decode(DataType.UInt16, decoder);
        expect(cell.dataType).to.equal(DataType.UInt16);
        expect(cell.value).to.equal(5);
      });
    });

    context("data type === 32 bits", () => {
      it("should read a signed integer", () => {
        const decoder = getDecoder(4, 'int32', -5);
        const cell = NumberCell.decode(DataType.Int32, decoder);
        expect(cell.dataType).to.equal(DataType.Int32);
        expect(cell.value).to.equal(-5);
      });

      it("should read an unsigned integer", () => {
        const decoder = getDecoder(4, 'uint32', 5);
        const cell = NumberCell.decode(DataType.UInt32, decoder);
        expect(cell.dataType).to.equal(DataType.UInt32);
        expect(cell.value).to.equal(5);
      });

      it("should read a float", () => {
        const decoder = getDecoder(4, 'float', 1.5);
        const cell = NumberCell.decode(DataType.Float, decoder);
        expect(cell.dataType).to.equal(DataType.Float);
        expect(cell.value).to.equal(1.5);
      });

      it("should read a localization key", () => {
        const decoder = getDecoder(4, 'uint32', 0x12345678);
        const cell = NumberCell.decode(DataType.LocalizationKey, decoder);
        expect(cell.dataType).to.equal(DataType.LocalizationKey);
        expect(cell.value).to.equal(0x12345678);
      });
    });
  });

  describe("static#fromXmlNode()", () => {
    it("should parse a positive integer", () => {
      const node = getPlainNode(15);
      const cell = NumberCell.fromXmlNode(DataType.UInt32, node);
      expect(cell.value).to.equal(15);
    });

    it("should parse a negative integer", () => {
      const node = getPlainNode(-15);
      const cell = NumberCell.fromXmlNode(DataType.Int32, node);
      expect(cell.value).to.equal(-15);
    });

    it("should parse a positive integer from a string", () => {
      const node = getPlainNode("15");
      const cell = NumberCell.fromXmlNode(DataType.UInt32, node);
      expect(cell.value).to.equal(15);
    });

    it("should parse a negative integer from a string", () => {
      const node = getPlainNode("-15");
      const cell = NumberCell.fromXmlNode(DataType.Int32, node);
      expect(cell.value).to.equal(-15);
    });

    it("should parse a positive float", () => {
      const node = getPlainNode(1.5);
      const cell = NumberCell.fromXmlNode(DataType.Float, node);
      expect(cell.value).to.equal(1.5);
    });

    it("should parse a negative float", () => {
      const node = getPlainNode(-1.5);
      const cell = NumberCell.fromXmlNode(DataType.Float, node);
      expect(cell.value).to.equal(-1.5);
    });

    it("should parse a positive float from a string", () => {
      const node = getPlainNode("1.5");
      const cell = NumberCell.fromXmlNode(DataType.Float, node);
      expect(cell.value).to.equal(1.5);
    });

    it("should parse a negative float from a string", () => {
      const node = getPlainNode("-1.5");
      const cell = NumberCell.fromXmlNode(DataType.Float, node);
      expect(cell.value).to.equal(-1.5);
    });

    it("should parse an integer for a loc key", () => {
      const node = getPlainNode(0x12345678);
      const cell = NumberCell.fromXmlNode(DataType.LocalizationKey, node);
      expect(cell.value).to.equal(0x12345678);
    });

    it("should parse a string for a loc key", () => {
      const node = getPlainNode("0x12345678");
      const cell = NumberCell.fromXmlNode(DataType.LocalizationKey, node);
      expect(cell.value).to.equal(0x12345678);
    });

    it("should use a value of 0 if it's undefined", () => {
      const node = getPlainNode(undefined);
      const cell = NumberCell.fromXmlNode(DataType.UInt32, node);
      expect(cell.value).to.equal(0);
    });

    it("should use a value of 0 if it's null", () => {
      const node = getPlainNode(null);
      const cell = NumberCell.fromXmlNode(DataType.UInt32, node);
      expect(cell.value).to.equal(0);
    });

    it("should throw if the inner value is NaN", () => {
      const node = getPlainNode(NaN);
      expect(() => {
        NumberCell.fromXmlNode(DataType.UInt32, node);
      }).to.throw();
    });

    it("should throw if the inner value cannot be parsed as a number", () => {
      const node = getPlainNode("hi");
      expect(() => {
        NumberCell.fromXmlNode(DataType.UInt32, node);
      }).to.throw();
    });
  });

  describe("static#getDefault()", () => {
    it("should return a cell with a value of 0", () => {
      const cell = NumberCell.getDefault(DataType.UInt32);
      expect(cell.dataType).to.equal(DataType.UInt32);
      expect(cell.value).to.equal(0);
    });
  });
});

describe("BigIntCell", function() {
  describe("#value", () => {
    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const cell = new BigIntCell(DataType.UInt64, 50n, owner);
      expect(owner.cached).to.be.true;
      cell.value = 25n;
      expect(owner.cached).to.be.false;
    });
  });

  describe("#constructor()", () => {
    it("should use the given data type and value", () => {
      const cell = new BigIntCell(DataType.UInt64, 50n);
      expect(cell.dataType).to.equal(DataType.UInt64);
      expect(cell.value).to.equal(50n);
    });
  });

  describe("#clone()", () => {
    it("should copy the data type and value", () => {
      const cell = new BigIntCell(DataType.UInt64, 50n);
      const clone = cell.clone();
      expect(clone.dataType).to.equal(DataType.UInt64);
      expect(clone.value).to.equal(50n);
    });

    it("should not copy the owner", () => {
      const owner = new MockOwner();
      const cell = new BigIntCell(DataType.UInt64, 50n, owner);
      const clone = cell.clone();
      expect(clone.owner).to.be.undefined;
    });

    it("should not mutate the original", () => {
      const cell = new BigIntCell(DataType.UInt64, 50n);
      const clone = cell.clone();
      clone.value = 100n;
      expect(cell.value).to.equal(50n);
    });
  });

  describe("#encode()", () => {
    it("should write uint64 in 8 bytes", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new BigIntCell(DataType.UInt64, 0x1234567812345678n);
      cell.encode(encoder);
      expect(encoder.tell()).to.equal(8);
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.uint64()).to.equal(0x1234567812345678n);
    });

    it("should write positive int64 in 8 bytes", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new BigIntCell(DataType.Int64, 0x12345678n);
      cell.encode(encoder);
      expect(encoder.tell()).to.equal(8);
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.int64()).to.equal(0x12345678n);
    });

    it("should write negative int64 in 8 bytes", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new BigIntCell(DataType.Int64, -0x12345678n);
      cell.encode(encoder);
      expect(encoder.tell()).to.equal(8);
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.int64()).to.equal(-0x12345678n);
    });

    it("should throw if uint64 is negative", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new BigIntCell(DataType.UInt64, -0x12345678n);
      expect(() => {
        cell.encode(encoder);
      }).to.throw();
    });

    it("should throw if table set ref is negative", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new BigIntCell(DataType.TableSetReference, -0x12345678n);
      expect(() => {
        cell.encode(encoder);
      }).to.throw();
    });

    it("should throw if value is out of bounds", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new BigIntCell(DataType.Int64, 0xFFFF_FFFF_FFFF_FFFFn);
      expect(() => {
        cell.encode(encoder);
      }).to.throw();
    });
  });

  describe("#equals()", () => {
    it("should return true when both have the same type and value", () => {
      const cell = new BigIntCell(DataType.UInt64, 64n);
      const other = new BigIntCell(DataType.UInt64, 64n);
      expect(cell.equals(other)).to.be.true;
    });

    it("should return false when type is different", () => {
      const cell = new BigIntCell(DataType.UInt64, 64n);
      const other = new BigIntCell(DataType.TableSetReference, 64n);
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when value is different", () => {
      const cell = new BigIntCell(DataType.UInt64, 64n);
      const other = new BigIntCell(DataType.UInt64, 128n);
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when other is undefined", () => {
      const cell = new BigIntCell(DataType.UInt64, 64n);
      expect(cell.equals(undefined)).to.be.false;
    });
  });

  describe("#toXmlNode()", () => {
    it("should create a node that contains the value", () => {
      const cell = new BigIntCell(DataType.UInt64, 25n);
      const node = cell.toXmlNode();
      expect(node.toXml()).to.equal(`<T>25</T>`);
    });

    it("should have a type attribute when option is true", () => {
      const cell = new BigIntCell(DataType.UInt64, 25n);
      const node = cell.toXmlNode({ typeAttr: true });
      expect(node.toXml()).to.equal(`<T type="UInt64">25</T>`);
    });

    it("should use the name attribute when given", () => {
      const cell = new BigIntCell(DataType.UInt64, 25n);
      const node = cell.toXmlNode({ nameAttr: "bigint" });
      expect(node.toXml()).to.equal(`<T name="bigint">25</T>`);
    });

    it("should use both attributes when given", () => {
      const cell = new BigIntCell(DataType.TableSetReference, 12345n);
      const node = cell.toXmlNode({ nameAttr: "bigint", typeAttr: true });
      expect(node.toXml()).to.equal(`<T name="bigint" type="TableSetReference">12345</T>`);
    });
  });

  describe("#validate()", () => {
    it("should do nothing when int64 is positive and in range", () => {
      const cell = new BigIntCell(DataType.Int64, 10n);
      expect(() => cell.validate()).to.not.throw();
    });

    it("should do nothing when int64 is negative and in range", () => {
      const cell = new BigIntCell(DataType.Int64, -10n);
      expect(() => cell.validate()).to.not.throw();
    });

    it("should throw when int64 is negative and out of range", () => {
      const cell = new BigIntCell(DataType.Int64, -1234567890987654321234567890n);
      expect(() => cell.validate()).to.throw();
    });

    it("should throw when int64 is positive and out of range", () => {
      const cell = new BigIntCell(DataType.Int64, 1234567890987654321234567890n);
      expect(() => cell.validate()).to.throw();
    });

    it("should do nothing when uint64 is in range", () => {
      const cell = new BigIntCell(DataType.UInt64, 10n);
      expect(() => cell.validate()).to.not.throw();
    });

    it("should throw when uint64 is negative", () => {
      const cell = new BigIntCell(DataType.UInt64, -10n);
      expect(() => cell.validate()).to.throw();
    });

    it("should throw when uint64 is positive and out of range", () => {
      const cell = new BigIntCell(DataType.UInt64, 1234567890987654321234567890n);
      expect(() => cell.validate()).to.throw();
    });

    it("should throw when value is undefined", () => {
      const cell = new BigIntCell(DataType.UInt64, undefined);
      expect(() => cell.validate()).to.throw();
    });

    it("should throw when value is null", () => {
      const cell = new BigIntCell(DataType.UInt64, null);
      expect(() => cell.validate()).to.throw();
    });
  });

  describe("static#decode()", () => {
    function getDecoder(type: string, value: bigint) {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      encoder[type](value);
      return new BinaryDecoder(buffer);
    }

    it("should read a negative int64", () => {
      const decoder = getDecoder('int64', -0x12345678n);
      const cell = BigIntCell.decode(DataType.Int64, decoder);
      expect(cell.value).to.equal(-0x12345678n);
    });

    it("should read a positive int64", () => {
      const decoder = getDecoder('int64', 0x12345678n);
      const cell = BigIntCell.decode(DataType.Int64, decoder);
      expect(cell.value).to.equal(0x12345678n);
    });

    it("should read a uint64", () => {
      const decoder = getDecoder('uint64', 0x1234567812345678n);
      const cell = BigIntCell.decode(DataType.UInt64, decoder);
      expect(cell.value).to.equal(0x1234567812345678n);
    });

    it("should read a table set ref", () => {
      const decoder = getDecoder('uint64', 0xFFFF_FFFF_FFFF_FFFFn);
      const cell = BigIntCell.decode(DataType.TableSetReference, decoder);
      expect(cell.value).to.equal(0xFFFF_FFFF_FFFF_FFFFn);
    });
  });

  describe("static#fromXmlNode()", () => {
    it("should parse a positive number", () => {
      const node = getPlainNode(123456789087654321n);
      const cell = BigIntCell.fromXmlNode(DataType.UInt64, node);
      expect(cell.value).to.equal(123456789087654321n);
    });

    it("should parse a negative number", () => {
      const node = getPlainNode(-123456789087654321n);
      const cell = BigIntCell.fromXmlNode(DataType.Int64, node);
      expect(cell.value).to.equal(-123456789087654321n);
    });

    it("should parse a positive number string", () => {
      const node = getPlainNode("123456789087654321");
      const cell = BigIntCell.fromXmlNode(DataType.UInt64, node);
      expect(cell.value).to.equal(123456789087654321n);
    });

    it("should parse a negative number string", () => {
      const node = getPlainNode("-123456789087654321");
      const cell = BigIntCell.fromXmlNode(DataType.Int64, node);
      expect(cell.value).to.equal(-123456789087654321n);
    });

    it("should parse a positive hex string", () => {
      const node = getPlainNode("0x1234567890ABCDEF");
      const cell = BigIntCell.fromXmlNode(DataType.TableSetReference, node);
      expect(cell.value).to.equal(0x1234567890ABCDEFn);
    });

    it("should use a value of 0 if it's undefined", () => {
      const node = getPlainNode(undefined);
      const cell = BigIntCell.fromXmlNode(DataType.UInt64, node);
      expect(cell.value).to.equal(0n);
    });

    it("should use a value of 0 if it's null", () => {
      const node = getPlainNode(null);
      const cell = BigIntCell.fromXmlNode(DataType.UInt64, node);
      expect(cell.value).to.equal(0n);
    });

    it("should throw if the inner value is NaN", () => {
      const node = getPlainNode(NaN);
      expect(() => {
        BigIntCell.fromXmlNode(DataType.UInt64, node);
      }).to.throw();
    });

    it("should throw if the inner value cannot be parsed as a bigint", () => {
      const node = getPlainNode("hello");
      expect(() => {
        BigIntCell.fromXmlNode(DataType.UInt64, node);
      }).to.throw();
    });
  });

  describe("static#getDefault()", () => {
    it("should return a cell with the given data type and a value of 0", () => {
      const cell = BigIntCell.getDefault(DataType.UInt64);
      expect(cell.dataType).to.equal(DataType.UInt64);
      expect(cell.value).to.equal(0n);
    });
  });
});

describe("ResourceKeyCell", function() {
  describe("#type", () => {
    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const cell = new ResourceKeyCell(1, 2, 3n, owner);
      expect(owner.cached).to.be.true;
      cell.type = 4;
      expect(owner.cached).to.be.false;
    });
  });

  describe("#group", () => {
    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const cell = new ResourceKeyCell(1, 2, 3n, owner);
      expect(owner.cached).to.be.true;
      cell.group = 4;
      expect(owner.cached).to.be.false;
    });
  });

  describe("#instance", () => {
    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const cell = new ResourceKeyCell(1, 2, 3n, owner);
      expect(owner.cached).to.be.true;
      cell.instance = 4n;
      expect(owner.cached).to.be.false;
    });
  });

  describe("#constructor()", () => {
    it("should use the given type, group, and instance", () => {
      const cell = new ResourceKeyCell(1, 2, 3n);
      expect(cell.type).to.equal(1);
      expect(cell.group).to.equal(2);
      expect(cell.instance).to.equal(3n);
    });

    it("should have an undefined owner if none is given", () => {
      const cell = new ResourceKeyCell(1, 2, 3n);
      expect(cell.owner).to.be.undefined;
    });

    it("should use the given owner", () => {
      const owner = new MockOwner();
      const cell = new ResourceKeyCell(1, 2, 3n, owner);
      expect(cell.owner).to.equal(owner);
    });

    it("should have a data type of ResourceKey", () => {
      const cell = new ResourceKeyCell(1, 2, 3n);
      expect(cell.dataType).to.equal(DataType.ResourceKey);
    });
  });

  describe("#clone()", () => {
    it("should copy the type, group, and instance", () => {
      const cell = new ResourceKeyCell(1, 2, 3n);
      const clone = cell.clone();
      expect(clone.type).to.equal(1);
      expect(clone.group).to.equal(2);
      expect(clone.instance).to.equal(3n);
    });

    it("should not copy the owner", () => {
      const owner = new MockOwner();
      const cell = new ResourceKeyCell(1, 2, 3n, owner);
      const clone = cell.clone();
      expect(clone.owner).to.be.undefined;
    });

    it("should not mutate the original", () => {
      const cell = new ResourceKeyCell(1, 2, 3n);
      const clone = cell.clone();
      clone.type = 4;
      expect(cell.type).to.equal(1);
    });
  });

  describe("#encode()", () => {
    it("should write the values in the order of instance, type, group", () => {
      const buffer = Buffer.alloc(16);
      const encoder = new BinaryEncoder(buffer);
      const cell = new ResourceKeyCell(0x220557DA, 0x80000000, 0x0012B12A0D85486En);
      cell.encode(encoder);
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.uint64()).to.equal(0x0012B12A0D85486En);
      expect(decoder.uint32()).to.equal(0x220557DA);
      expect(decoder.uint32()).to.equal(0x80000000);
    });

    it("should throw if validation fails", () => {
      const buffer = Buffer.alloc(16);
      const encoder = new BinaryEncoder(buffer);
      const cell = new ResourceKeyCell(10, -10, 10n);
      expect(() => cell.encode(encoder)).to.throw();
    });
  });

  describe("#equals()", () => {
    it("should return true when both have the same data type and values", () => {
      const cell = new ResourceKeyCell(1, 2, 3n);
      const other = new ResourceKeyCell(1, 2, 3n);
      expect(cell.equals(other)).to.be.true;
    });

    it("should return false when data type is different", () => {
      const cell = new ResourceKeyCell(1, 2, 3n);
      const other = new Float3Cell(1, 2, 3);
      //@ts-expect-error
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when type is different", () => {
      const cell = new ResourceKeyCell(1, 2, 3n);
      const other = new ResourceKeyCell(0, 2, 3n);
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when group is different", () => {
      const cell = new ResourceKeyCell(1, 2, 3n);
      const other = new ResourceKeyCell(1, 0, 3n);
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when instance is different", () => {
      const cell = new ResourceKeyCell(1, 2, 3n);
      const other = new ResourceKeyCell(1, 2, 0n);
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when other is undefined", () => {
      const cell = new ResourceKeyCell(1, 2, 3n);
      expect(cell.equals(undefined)).to.be.false;
    });
  });

  describe("#toXmlNode()", () => {
    it("should create a node with the TGI in a hyphen-separated string", () => {
      const cell = new ResourceKeyCell(0x220557DA, 0x80000000, 0x0012B12A0D85486En);
      const node = cell.toXmlNode();
      expect(node.toXml()).to.equal(`<T>220557DA-80000000-0012B12A0D85486E</T>`);
    });

    it("should include a name when one is given", () => {
      const cell = new ResourceKeyCell(0x220557DA, 0x80000000, 0x0012B12A0D85486En);
      const node = cell.toXmlNode({ nameAttr: "reskey" });
      expect(node.toXml()).to.equal(`<T name="reskey">220557DA-80000000-0012B12A0D85486E</T>`);
    });

    it("should include the type when told to", () => {
      const cell = new ResourceKeyCell(0x220557DA, 0x80000000, 0x0012B12A0D85486En);
      const node = cell.toXmlNode({ typeAttr: true });
      expect(node.toXml()).to.equal(`<T type="ResourceKey">220557DA-80000000-0012B12A0D85486E</T>`);
    });
  });

  describe("#validate()", () => {
    it("should not throw if type and group are <= 32 bit and instance is <= 64 bit", () => {
      const cell = new ResourceKeyCell(0x220557DA, 0x80000000, 0x0012B12A0D85486En);
      expect(() => cell.validate()).to.not.throw();
    });

    it("should throw if type is negative", () => {
      const cell = new ResourceKeyCell(-0x220557DA, 0x80000000, 0x0012B12A0D85486En);
      expect(() => cell.validate()).to.throw();
    });

    it("should throw if group is negative", () => {
      const cell = new ResourceKeyCell(0x220557DA, -0x80000000, 0x0012B12A0D85486En);
      expect(() => cell.validate()).to.throw();
    });

    it("should throw if instance is negative", () => {
      const cell = new ResourceKeyCell(0x220557DA, 0x80000000, -0x0012B12A0D85486En);
      expect(() => cell.validate()).to.throw();
    });

    it("should throw if type is > 32 bit", () => {
      const cell = new ResourceKeyCell(0x0012B12A0D85, 0x80000000, 0x0012B12A0D85486En);
      expect(() => cell.validate()).to.throw();
    });

    it("should throw if group is > 32 bit", () => {
      const cell = new ResourceKeyCell(0x80000000, 0x0012B12A0D85, 0x0012B12A0D85486En);
      expect(() => cell.validate()).to.throw();
    });

    it("should throw if instance is > 64 bit", () => {
      const cell = new ResourceKeyCell(0x80000000, 0x0012B12A0D85, 0x0012B12A0D85486EFFn);
      expect(() => cell.validate()).to.throw();
    });
  });

  describe("static#decode()", () => {
    it("should read instance, type, then group", () => {
      const buffer = Buffer.alloc(16);
      const encoder = new BinaryEncoder(buffer);
      encoder.uint64(0x1234n);
      encoder.uint32(0x12345678);
      encoder.uint32(0x80000000);
      const decoder = new BinaryDecoder(buffer);
      const cell = ResourceKeyCell.decode(decoder);
      expect(cell.type).to.equal(0x12345678);
      expect(cell.group).to.equal(0x80000000);
      expect(cell.instance).to.equal(0x1234n);
    });
  });

  describe("static#fromXmlNode()", () => {
    it("should read type/group/instance as hex separated by hyphens", () => {
      const node = getPlainNode("220557DA-80000000-0012B12A0D85486E");
      const cell = ResourceKeyCell.fromXmlNode(node);
      expect(cell.type).to.equal(0x220557DA);
      expect(cell.group).to.equal(0x80000000);
      expect(cell.instance).to.equal(0x0012B12A0D85486En);
    });

    it("should throw if there are less than 3 numbers separated by hyphen", () => {
      const node = getPlainNode("220557DA-0012B12A0D85486E");
      expect(() => ResourceKeyCell.fromXmlNode(node)).to.throw();
    });

    it("should throw if there are more than 3 numbers separated by hyphen", () => {
      const node = getPlainNode("220557DA-80000000-220557DA-0012B12A0D85486E");
      expect(() => ResourceKeyCell.fromXmlNode(node)).to.throw();
    });

    it("should throw if type is not a number", () => {
      const node = getPlainNode("HELLOLOL-80000000-0012B12A0D85486E");
      expect(() => ResourceKeyCell.fromXmlNode(node)).to.throw();
    });

    it("should throw if group is not a number", () => {
      const node = getPlainNode("220557DA-HELLOLOL-0012B12A0D85486E");
      expect(() => ResourceKeyCell.fromXmlNode(node)).to.throw();
    });

    it("should throw if instance is not a bigint", () => {
      const node = getPlainNode("220557DA-80000000-THISISNOTANUMBER");
      expect(() => ResourceKeyCell.fromXmlNode(node)).to.throw();
    });
  });

  describe("static#getDefault()", () => {
    it("should return a cell with 0 for all values", () => {
      const cell = ResourceKeyCell.getDefault();
      expect(cell.type).to.equal(0);
      expect(cell.group).to.equal(0);
      expect(cell.instance).to.equal(0n);
    });
  });
});

describe("Float2Cell", function() {
  describe("#x", () => {
    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const cell = new Float2Cell(1, 2, owner);
      expect(owner.cached).to.be.true;
      cell.x = 5;
      expect(owner.cached).to.be.false;
    });
  });

  describe("#y", () => {
    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const cell = new Float2Cell(1, 2, owner);
      expect(owner.cached).to.be.true;
      cell.y = 5;
      expect(owner.cached).to.be.false;
    });
  });

  describe("#constructor()", () => {
    it("should create a cell with the given values", () => {
      const cell = new Float2Cell(1, 2);
      expect(cell.x).to.equal(1);
      expect(cell.y).to.equal(2);
    });

    it("should set undefined/null values to 0", () => {
      const cell = new Float2Cell(undefined, null);
      expect(cell.x).to.equal(0);
      expect(cell.y).to.equal(0);
    });

    it("should have a data type of Float2", () => {
      const cell = new Float2Cell(1, 2);
      expect(cell.dataType).to.equal(DataType.Float2);
    });
  });

  describe("#clone()", () => {
    it("should copy the float values", () => {
      const cell = new Float2Cell(1, 2);
      const clone = cell.clone();
      expect(clone.x).to.equal(1);
      expect(clone.y).to.equal(2);
    });

    it("should not copy the owner", () => {
      const owner = new MockOwner();
      const cell = new Float2Cell(1, 2, owner);
      const clone = cell.clone();
      expect(clone.owner).to.be.undefined;
    });

    it("should not mutate the original", () => {
      const cell = new Float2Cell(1, 2);
      const clone = cell.clone();
      clone.x = 4;
      expect(cell.x).to.equal(1);
    });
  });

  describe("#encode()", () => {
    it("should write the floats in order", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new Float2Cell(1.1, 2.2);
      cell.encode(encoder);
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.float()).to.be.approximately(1.1, 0.001);
      expect(decoder.float()).to.be.approximately(2.2, 0.001);
    });

    it("should write the correct floats after one is updated", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new Float2Cell(1.1, 2.2);
      cell.x = 3.3;
      cell.encode(encoder);
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.float()).to.be.approximately(3.3, 0.001);
      expect(decoder.float()).to.be.approximately(2.2, 0.001);
    });

    it("should throw when an argument is undefined", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new Float2Cell(1.1, 2.2);
      cell.x = undefined;
      expect(() => cell.encode(encoder)).to.throw();
    });

    it("should throw when an argument is null", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new Float2Cell(1.1, 2.2);
      cell.x = null;
      expect(() => cell.encode(encoder)).to.throw();
    });
  });

  describe("#equals()", () => {
    it("should return true when both have the same data type and values", () => {
      const cell = new Float2Cell(1, 2);
      const other = new Float2Cell(1, 2);
      expect(cell.equals(other)).to.be.true;
    });

    it("should return false when data type is different", () => {
      const cell = new Float2Cell(1, 2);
      const other = new Float3Cell(1, 2, 3);
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when x is different", () => {
      const cell = new Float2Cell(1, 2);
      const other = new Float2Cell(0, 2);
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when y is different", () => {
      const cell = new Float2Cell(1, 2);
      const other = new Float2Cell(1, 0);
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when other is undefined", () => {
      const cell = new Float2Cell(1, 2);
      expect(cell.equals(undefined)).to.be.false;
    });
  });

  describe("#toXmlNode()", () => {
    it("should create a node with the floats separated by commas", () => {
      const cell = new Float2Cell(1.1, 2.2);
      const node = cell.toXmlNode();
      expect(node.toXml()).to.equal(`<T>1.1,2.2</T>`);
    });

    it("should include the name attribute that is given", () => {
      const cell = new Float2Cell(1.1, 2.2);
      const node = cell.toXmlNode({ nameAttr: "float2" });
      expect(node.toXml()).to.equal(`<T name="float2">1.1,2.2</T>`);
    });

    it("should include the type attribute if told to", () => {
      const cell = new Float2Cell(1.1, 2.2);
      const node = cell.toXmlNode({ typeAttr: true });
      expect(node.toXml()).to.equal(`<T type="Float2">1.1,2.2</T>`);
    });
  });

  describe("#validate()", () => {
    it("should not throw when arguments are all floats", () => {
      const cell = new Float2Cell(2.3, 1.1);
      expect(() => cell.validate()).to.not.throw();
    });

    it("should throw when any argument is undefined", () => {
      const cell = new Float2Cell(2.3, 1.1);
      cell.x = undefined;
      expect(() => cell.validate()).to.throw();
    });

    it("should throw when any argument is null", () => {
      const cell = new Float2Cell(2.3, 1.1);
      cell.x = null;
      expect(() => cell.validate()).to.throw();
    });
  });

  describe("static#decode()", () => {
    it("should read consecutive floats", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      encoder.float(1.5);
      encoder.float(-1.5);
      const decoder = new BinaryDecoder(buffer);
      const cell = Float2Cell.decode(decoder);
      expect(cell.x).to.equal(1.5);
      expect(cell.y).to.equal(-1.5);
    });
  });

  describe("static#fromXmlNode()", () => {
    it("should read two consecutive floats separated by commas", () => {
      const node = getPlainNode("1.1,2.2");
      const cell = Float2Cell.fromXmlNode(node);
      expect(cell.x).to.be.approximately(1.1, 0.001);
      expect(cell.y).to.be.approximately(2.2, 0.001);
    });

    it("should read two negative floats", () => {
      const node = getPlainNode("-1.1,2.2");
      const cell = Float2Cell.fromXmlNode(node);
      expect(cell.x).to.be.approximately(-1.1, 0.001);
      expect(cell.y).to.be.approximately(2.2, 0.001);
    });

    it("should throw if there are more than two floats", () => {
      const node = getPlainNode("1.1,2.2,3.3");
      expect(() => Float2Cell.fromXmlNode(node)).to.throw();
    });

    it("should throw if there are less than two floats", () => {
      const node = getPlainNode("1.1");
      expect(() => Float2Cell.fromXmlNode(node)).to.throw();
    });

    it("should throw if any float cannot be parsed as a number", () => {
      const node = getPlainNode("a,1.1");
      expect(() => Float2Cell.fromXmlNode(node)).to.throw();
    });
  });

  describe("static#getDefault()", () => {
    it("should create a cell with floats of 0", () => {
      const cell = Float2Cell.getDefault();
      expect(cell.x).to.equal(0);
      expect(cell.y).to.equal(0);
    });
  });
});

describe("Float3Cell", function() {
  describe("#x", () => {
    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const cell = new Float3Cell(1, 2, 3, owner);
      expect(owner.cached).to.be.true;
      cell.x = 5;
      expect(owner.cached).to.be.false;
    });
  });

  describe("#y", () => {
    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const cell = new Float3Cell(1, 2, 3, owner);
      expect(owner.cached).to.be.true;
      cell.y = 5;
      expect(owner.cached).to.be.false;
    });
  });

  describe("#z", () => {
    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const cell = new Float3Cell(1, 2, 3, owner);
      expect(owner.cached).to.be.true;
      cell.z = 5;
      expect(owner.cached).to.be.false;
    });
  });

  describe("#constructor()", () => {
    it("should create a cell with the given values", () => {
      const cell = new Float3Cell(1, 2, 3);
      expect(cell.x).to.equal(1);
      expect(cell.y).to.equal(2);
      expect(cell.z).to.equal(3);
    });

    it("should set undefined/null values to 0", () => {
      const cell = new Float3Cell(undefined, null, undefined);
      expect(cell.x).to.equal(0);
      expect(cell.y).to.equal(0);
      expect(cell.z).to.equal(0);
    });

    it("should have a data type of Float3", () => {
      const cell = new Float3Cell(1, 2, 3);
      expect(cell.dataType).to.equal(DataType.Float3);
    });
  });

  describe("#clone()", () => {
    it("should copy the float values", () => {
      const cell = new Float3Cell(1, 2, 3);
      const clone = cell.clone();
      expect(clone.x).to.equal(1);
      expect(clone.y).to.equal(2);
      expect(clone.z).to.equal(3);
    });

    it("should not copy the owner", () => {
      const owner = new MockOwner();
      const cell = new Float3Cell(1, 2, 3, owner);
      const clone = cell.clone();
      expect(clone.owner).to.be.undefined;
    });

    it("should not mutate the original", () => {
      const cell = new Float3Cell(1, 2, 3);
      const clone = cell.clone();
      clone.z = 4;
      expect(cell.z).to.equal(3);
    });
  });

  describe("#encode()", () => {
    it("should write the floats in order", () => {
      const buffer = Buffer.alloc(12);
      const encoder = new BinaryEncoder(buffer);
      const cell = new Float3Cell(1.1, 2.2, 3.3);
      cell.encode(encoder);
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.float()).to.be.approximately(1.1, 0.001);
      expect(decoder.float()).to.be.approximately(2.2, 0.001);
      expect(decoder.float()).to.be.approximately(3.3, 0.001);
    });

    it("should write the correct floats after one is updated", () => {
      const buffer = Buffer.alloc(12);
      const encoder = new BinaryEncoder(buffer);
      const cell = new Float3Cell(1.1, 2.2, 3.3);
      cell.x = 3.3;
      cell.encode(encoder);
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.float()).to.be.approximately(3.3, 0.001);
      expect(decoder.float()).to.be.approximately(2.2, 0.001);
      expect(decoder.float()).to.be.approximately(3.3, 0.001);
    });

    it("should throw when an argument is undefined", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new Float3Cell(1.1, 2.2, 3.3);
      cell.z = undefined;
      expect(() => cell.encode(encoder)).to.throw();
    });

    it("should throw when an argument is null", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new Float3Cell(1.1, 2.2, 3.3);
      cell.z = null;
      expect(() => cell.encode(encoder)).to.throw();
    });
  });

  describe("#equals()", () => {
    it("should return true when both have the same data type and values", () => {
      const cell = new Float3Cell(1, 2, 3);
      const other = new Float3Cell(1, 2, 3);
      expect(cell.equals(other)).to.be.true;
    });

    it("should return false when data type is different", () => {
      const cell = new Float3Cell(1, 2, 3);
      const other = new Float2Cell(1, 2);
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when x is different", () => {
      const cell = new Float3Cell(1, 2, 3);
      const other = new Float3Cell(0, 2, 3);
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when y is different", () => {
      const cell = new Float3Cell(1, 2, 3);
      const other = new Float3Cell(1, 0, 3);
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when z is different", () => {
      const cell = new Float3Cell(1, 2, 3);
      const other = new Float3Cell(1, 2, 0);
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when other is undefined", () => {
      const cell = new Float3Cell(1, 2, 3);
      expect(cell.equals(undefined)).to.be.false;
    });
  });

  describe("#toXmlNode()", () => {
    it("should create a node with the floats separated by commas", () => {
      const cell = new Float3Cell(1.1, 2.2, 3.3);
      const node = cell.toXmlNode();
      expect(node.toXml()).to.equal(`<T>1.1,2.2,3.3</T>`);
    });

    it("should include the name attribute that is given", () => {
      const cell = new Float3Cell(1.1, 2.2, 3.3);
      const node = cell.toXmlNode({ nameAttr: "float3" });
      expect(node.toXml()).to.equal(`<T name="float3">1.1,2.2,3.3</T>`);
    });

    it("should include the type attribute if told to", () => {
      const cell = new Float3Cell(1.1, 2.2, 3.3);
      const node = cell.toXmlNode({ typeAttr: true });
      expect(node.toXml()).to.equal(`<T type="Float3">1.1,2.2,3.3</T>`);
    });
  });

  describe("#validate()", () => {
    it("should not throw when arguments are all floats", () => {
      const cell = new Float3Cell(2.3, 1.1, 4.5);
      expect(() => cell.validate()).to.not.throw();
    });

    it("should throw when any argument is undefined", () => {
      const cell = new Float3Cell(2.3, 1.1, 4.5);
      cell.z = undefined;
      expect(() => cell.validate()).to.throw();
    });

    it("should throw when any argument is null", () => {
      const cell = new Float3Cell(2.3, 1.1, 4.5);
      cell.z = null;
      expect(() => cell.validate()).to.throw();
    });
  });

  describe("static#decode()", () => {
    it("should read consecutive floats", () => {
      const buffer = Buffer.alloc(12);
      const encoder = new BinaryEncoder(buffer);
      encoder.float(1.5);
      encoder.float(-1.5);
      encoder.float(2.3);
      const decoder = new BinaryDecoder(buffer);
      const cell = Float3Cell.decode(decoder);
      expect(cell.x).to.be.approximately(1.5, 0.001);
      expect(cell.y).to.be.approximately(-1.5, 0.001);
      expect(cell.z).to.be.approximately(2.3, 0.001);
    });
  });

  describe("static#fromXmlNode()", () => {
    it("should read three consecutive floats separated by commas", () => {
      const node = getPlainNode("1.1,2.2,3.3");
      const cell = Float3Cell.fromXmlNode(node);
      expect(cell.x).to.be.approximately(1.1, 0.001);
      expect(cell.y).to.be.approximately(2.2, 0.001);
      expect(cell.z).to.be.approximately(3.3, 0.001);
    });

    it("should read negative floats", () => {
      const node = getPlainNode("-1.1,2.2,-3.3");
      const cell = Float3Cell.fromXmlNode(node);
      expect(cell.x).to.be.approximately(-1.1, 0.001);
      expect(cell.y).to.be.approximately(2.2, 0.001);
      expect(cell.z).to.be.approximately(-3.3, 0.001);
    });

    it("should throw if there are more than three floats", () => {
      const node = getPlainNode("1.1,2.2,3.3,4.4");
      expect(() => Float3Cell.fromXmlNode(node)).to.throw();
    });

    it("should throw if there are less than three floats", () => {
      const node = getPlainNode("1.1");
      expect(() => Float3Cell.fromXmlNode(node)).to.throw();
    });

    it("should throw if any float cannot be parsed as a number", () => {
      const node = getPlainNode("a,1.1,b");
      expect(() => Float3Cell.fromXmlNode(node)).to.throw();
    });
  });

  describe("static#getDefault()", () => {
    it("should create a cell with floats of 0", () => {
      const cell = Float3Cell.getDefault();
      expect(cell.x).to.equal(0);
      expect(cell.y).to.equal(0);
      expect(cell.z).to.equal(0);
    });
  });
});

describe("Float4Cell", function() {
  describe("#x", () => {
    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const cell = new Float4Cell(1, 2, 3, 4, owner);
      expect(owner.cached).to.be.true;
      cell.x = 5;
      expect(owner.cached).to.be.false;
    });
  });

  describe("#y", () => {
    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const cell = new Float4Cell(1, 2, 3, 4, owner);
      expect(owner.cached).to.be.true;
      cell.y = 5;
      expect(owner.cached).to.be.false;
    });
  });

  describe("#z", () => {
    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const cell = new Float4Cell(1, 2, 3, 4, owner);
      expect(owner.cached).to.be.true;
      cell.z = 5;
      expect(owner.cached).to.be.false;
    });
  });

  describe("#w", () => {
    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const cell = new Float4Cell(1, 2, 3, 4, owner);
      expect(owner.cached).to.be.true;
      cell.w = 5;
      expect(owner.cached).to.be.false;
    });
  });

  describe("#constructor()", () => {
    it("should create a cell with the given values", () => {
      const cell = new Float4Cell(1, 2, 3, 4);
      expect(cell.x).to.equal(1);
      expect(cell.y).to.equal(2);
      expect(cell.z).to.equal(3);
      expect(cell.w).to.equal(4);
    });

    it("should set undefined/null values to 0", () => {
      const cell = new Float4Cell(undefined, null, undefined, null);
      expect(cell.x).to.equal(0);
      expect(cell.y).to.equal(0);
      expect(cell.z).to.equal(0);
      expect(cell.w).to.equal(0);
    });

    it("should have a data type of Float4", () => {
      const cell = new Float4Cell(1, 2, 3, 4);
      expect(cell.dataType).to.equal(DataType.Float4);
    });
  });

  describe("#clone()", () => {
    it("should copy the float values", () => {
      const cell = new Float4Cell(1, 2, 3, 4);
      const clone = cell.clone();
      expect(clone.x).to.equal(1);
      expect(clone.y).to.equal(2);
      expect(clone.z).to.equal(3);
      expect(clone.w).to.equal(4);
    });

    it("should not copy the owner", () => {
      const owner = new MockOwner();
      const cell = new Float4Cell(1, 2, 3, 4, owner);
      const clone = cell.clone();
      expect(clone.owner).to.be.undefined;
    });

    it("should not mutate the original", () => {
      const cell = new Float4Cell(1, 2, 3, 4);
      const clone = cell.clone();
      clone.w = 5;
      expect(cell.w).to.equal(4);
    });
  });

  describe("#encode()", () => {
    it("should write the floats in order", () => {
      const buffer = Buffer.alloc(16);
      const encoder = new BinaryEncoder(buffer);
      const cell = new Float4Cell(1.1, 2.2, 3.3, 4.4);
      cell.encode(encoder);
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.float()).to.be.approximately(1.1, 0.001);
      expect(decoder.float()).to.be.approximately(2.2, 0.001);
      expect(decoder.float()).to.be.approximately(3.3, 0.001);
      expect(decoder.float()).to.be.approximately(4.4, 0.001);
    });

    it("should write the correct floats after one is updated", () => {
      const buffer = Buffer.alloc(16);
      const encoder = new BinaryEncoder(buffer);
      const cell = new Float4Cell(1.1, 2.2, 3.3, 4.4);
      cell.x = 3.3;
      cell.encode(encoder);
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.float()).to.be.approximately(3.3, 0.001);
      expect(decoder.float()).to.be.approximately(2.2, 0.001);
      expect(decoder.float()).to.be.approximately(3.3, 0.001);
      expect(decoder.float()).to.be.approximately(4.4, 0.001);
    });

    it("should throw when an argument is undefined", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new Float4Cell(1.1, 2.2, 3.3, 4.4);
      cell.w = undefined;
      expect(() => cell.encode(encoder)).to.throw();
    });

    it("should throw when an argument is null", () => {
      const buffer = Buffer.alloc(8);
      const encoder = new BinaryEncoder(buffer);
      const cell = new Float4Cell(1.1, 2.2, 3.3, 4.4);
      cell.w = null;
      expect(() => cell.encode(encoder)).to.throw();
    });
  });

  describe("#equals()", () => {
    it("should return true when both have the same data type and values", () => {
      const cell = new Float4Cell(1, 2, 3, 4);
      const other = new Float4Cell(1, 2, 3, 4);
      expect(cell.equals(other)).to.be.true;
    });

    it("should return false when data type is different", () => {
      const cell = new Float4Cell(1, 2, 3, 4);
      const other = new Float2Cell(1, 2);
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when x is different", () => {
      const cell = new Float4Cell(1, 2, 3, 4);
      const other = new Float4Cell(0, 2, 3, 4);
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when y is different", () => {
      const cell = new Float4Cell(1, 2, 3, 4);
      const other = new Float4Cell(1, 0, 3, 4);
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when z is different", () => {
      const cell = new Float4Cell(1, 2, 3, 4);
      const other = new Float4Cell(1, 2, 0, 4);
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when w is different", () => {
      const cell = new Float4Cell(1, 2, 3, 4);
      const other = new Float4Cell(1, 2, 3, 0);
      expect(cell.equals(other)).to.be.false;
    });

    it("should return false when other is undefined", () => {
      const cell = new Float4Cell(1, 2, 3, 4);
      expect(cell.equals(undefined)).to.be.false;
    });
  });

  describe("#toXmlNode()", () => {
    it("should create a node with the floats separated by commas", () => {
      const cell = new Float4Cell(1.1, 2.2, 3.3, 4.4);
      const node = cell.toXmlNode();
      expect(node.toXml()).to.equal(`<T>1.1,2.2,3.3,4.4</T>`);
    });

    it("should include the name attribute that is given", () => {
      const cell = new Float4Cell(1.1, 2.2, 3.3, 4.4);
      const node = cell.toXmlNode({ nameAttr: "float4" });
      expect(node.toXml()).to.equal(`<T name="float4">1.1,2.2,3.3,4.4</T>`);
    });

    it("should include the type attribute if told to", () => {
      const cell = new Float4Cell(1.1, 2.2, 3.3, 4.4);
      const node = cell.toXmlNode({ typeAttr: true });
      expect(node.toXml()).to.equal(`<T type="Float4">1.1,2.2,3.3,4.4</T>`);
    });
  });

  describe("#validate()", () => {
    it("should not throw when arguments are all floats", () => {
      const cell = new Float4Cell(2.3, 1.1, 4.5, 3.8);
      expect(() => cell.validate()).to.not.throw();
    });

    it("should throw when any argument is undefined", () => {
      const cell = new Float4Cell(2.3, 1.1, 4.5, 3.8);
      cell.w = undefined;
      expect(() => cell.validate()).to.throw();
    });

    it("should throw when any argument is null", () => {
      const cell = new Float4Cell(2.3, 1.1, 4.5, 3.8);
      cell.w = null;
      expect(() => cell.validate()).to.throw();
    });
  });

  describe("static#decode()", () => {
    it("should read consecutive floats", () => {
      const buffer = Buffer.alloc(16);
      const encoder = new BinaryEncoder(buffer);
      encoder.float(1.5);
      encoder.float(-1.5);
      encoder.float(2.3);
      encoder.float(255);
      const decoder = new BinaryDecoder(buffer);
      const cell = Float4Cell.decode(decoder);
      expect(cell.x).to.be.approximately(1.5, 0.001);
      expect(cell.y).to.be.approximately(-1.5, 0.001);
      expect(cell.z).to.be.approximately(2.3, 0.001);
      expect(cell.w).to.be.approximately(255, 0.001);
    });
  });

  describe("static#fromXmlNode()", () => {
    it("should read four consecutive floats separated by commas", () => {
      const node = getPlainNode("1.1,2.2,3.3,4.4");
      const cell = Float4Cell.fromXmlNode(node);
      expect(cell.x).to.be.approximately(1.1, 0.001);
      expect(cell.y).to.be.approximately(2.2, 0.001);
      expect(cell.z).to.be.approximately(3.3, 0.001);
      expect(cell.w).to.be.approximately(4.4, 0.001);
    });

    it("should read negative floats", () => {
      const node = getPlainNode("-1.1,2.2,-3.3,4.4");
      const cell = Float4Cell.fromXmlNode(node);
      expect(cell.x).to.be.approximately(-1.1, 0.001);
      expect(cell.y).to.be.approximately(2.2, 0.001);
      expect(cell.z).to.be.approximately(-3.3, 0.001);
      expect(cell.w).to.be.approximately(4.4, 0.001);
    });

    it("should throw if there are more than four floats", () => {
      const node = getPlainNode("1.1,2.2,3.3,4.4,5.5");
      expect(() => Float4Cell.fromXmlNode(node)).to.throw();
    });

    it("should throw if there are less than four floats", () => {
      const node = getPlainNode("1.1,2.2,3.3");
      expect(() => Float4Cell.fromXmlNode(node)).to.throw();
    });

    it("should throw if any float cannot be parsed as a number", () => {
      const node = getPlainNode("a,1.1,b,4.4");
      expect(() => Float4Cell.fromXmlNode(node)).to.throw();
    });
  });

  describe("static#getDefault()", () => {
    it("should create a cell with floats of 0", () => {
      const cell = Float4Cell.getDefault();
      expect(cell.x).to.equal(0);
      expect(cell.y).to.equal(0);
      expect(cell.z).to.equal(0);
      expect(cell.w).to.equal(0);
    });
  });
});

//#endregion Tests
