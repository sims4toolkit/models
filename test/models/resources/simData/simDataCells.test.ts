import { expect } from "chai";
import { simDataCells, hashing, simDataTypes } from "../../../../dst/api";
import { BinaryDecoder, BinaryEncoder } from "../../../../dst/lib/utils/encoding";
import MockOwner from "../../mocks/mockOwner";

const cells = simDataCells;
const { fnv32 } = hashing;
const { SimDataType } = simDataTypes;

describe("Cell", function() {
  describe("static#parseXmlNode()", function() {
    // TODO:
  });
});

describe("BooleanCell", function() {
  describe("#value", () => {
    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const cell = new cells.BooleanCell(true, owner);
      expect(owner.cached).to.be.true;
      cell.value = false;
      expect(owner.cached).to.be.false;
    });

    it("should change the value when set", () => {
      const cell = new cells.BooleanCell(true);
      cell.value = false;
      expect(cell.value).to.be.false;
    });
  });

  describe("#constructor()", () => {
    it("should use the value that is given", () => {
      const cell = new cells.BooleanCell(true);
      expect(cell.value).to.be.true;
    });

    it("should have an undefined owner is none is given", () => {
      const cell = new cells.BooleanCell(true);
      expect(cell.owner).to.be.undefined;
    });

    it("should have an owner if one is given", () => {
      const owner = cells.VariantCell.getDefault();
      const cell = new cells.BooleanCell(true, owner);
      expect(cell.owner).to.equal(owner);
    });
  });

  describe("#clone()", () => {
    it("should not mutate the original", () => {
      const cell = new cells.BooleanCell(true);
      const clone = cell.clone();
      clone.value = false;
      expect(clone.value).to.be.false;
      expect(cell.value).to.be.true;
    });

    it("should not copy the owner", () => {
      const cell = new cells.BooleanCell(true);
      const owner = new cells.VariantCell(0, cell);
      const clone = cell.clone();
      expect(cell.owner).to.equal(owner);
      expect(clone.owner).to.be.undefined;
    });
  });

  describe("#encode()", () => {
    it("should write one byte", () => {
      const encoder = new BinaryEncoder(Buffer.alloc(1));
      const cell = new cells.BooleanCell(true);
      expect(encoder.tell()).to.equal(0);
      cell.encode(encoder);
      expect(encoder.tell()).to.equal(1);
    });

    it("should write 0 for false", () => {
      const buffer = Buffer.alloc(1);
      const encoder = new BinaryEncoder(buffer);
      const cell = new cells.BooleanCell(false);
      cell.encode(encoder);
      expect(buffer.readUInt8(0)).to.equal(0);
    });

    it("should write one byte", () => {
      const buffer = Buffer.alloc(1);
      const encoder = new BinaryEncoder(buffer);
      const cell = new cells.BooleanCell(true);
      cell.encode(encoder);
      expect(buffer.readUInt8(0)).to.equal(1);
    });
  });

  describe("#toXmlNode()", () => {
    // TODO:
  });

  describe("#validate()", () => {
    it("should not throw", () => {
      const cell = new cells.BooleanCell(true);
      expect(() => cell.validate()).to.not.throw();
    });
  });

  describe("static#decode()", () => {
    it("should read 1 as true", () => {
      const buffer = Buffer.alloc(1);
      const encoder = new BinaryEncoder(buffer);
      encoder.uint8(1);
      const decoder = new BinaryDecoder(buffer);
      const cell = cells.BooleanCell.decode(decoder);
      expect(cell.value).to.be.true;
    });

    it("should read 0 as false", () => {
      const buffer = Buffer.alloc(1);
      const decoder = new BinaryDecoder(buffer);
      const cell = cells.BooleanCell.decode(decoder);
      expect(cell.value).to.be.false;
    });
  });

  describe("static#fromXmlNode()", () => {
    // TODO:
  });

  describe("static#getDefault()", () => {
    it("should create a cell with a false value", () => {
      const cell = cells.BooleanCell.getDefault();
      expect(cell.value).to.be.false;
    });
  });
});

describe("TextCell", function() {
  describe("#value", () => {
    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const cell = new cells.TextCell(SimDataType.String, "hi", owner);
      expect(owner.cached).to.be.true;
      cell.value = "bye";
      expect(owner.cached).to.be.false;
    });

    it("should change the value when set", () => {
      const cell = new cells.TextCell(SimDataType.String, "hi");
      cell.value = "bye";
      expect(cell.value).to.equal("bye");
    });
  });

  describe("#constructor()", () => {
    it("should use the provided data type and value", () => {
      const cell = new cells.TextCell(SimDataType.String, "Something");
      expect(cell.dataType).to.equal(SimDataType.String);
      expect(cell.value).to.equal("Something");
    });
  });

  describe("#clone()", () => {
    it("should copy the data type and value", () => {
      const cell = new cells.TextCell(SimDataType.String, "Something");
      const clone = cell.clone();
      expect(clone.dataType).to.equal(SimDataType.String);
      expect(clone.value).to.equal("Something");
    });

    it("should not copy the owner", () => {
      const owner = new MockOwner();
      const cell = new cells.TextCell(SimDataType.String, "Something", owner);
      const clone = cell.clone();
      expect(clone.owner).to.be.undefined;
    });

    it("should not mutate the original", () => {
      const cell = new cells.TextCell(SimDataType.String, "Something");
      const clone = cell.clone();
      clone.value = "Something else";
      expect(cell.value).to.equal("Something");
    });
  });

  describe("#encode()", () => {
    context("data type === character", () => {
      it("should write 1 byte", () => {
        const cell = new cells.TextCell(SimDataType.Character, "a");
        const encoder = new BinaryEncoder(Buffer.alloc(1));
        cell.encode(encoder);
        expect(encoder.tell()).to.equal(1);
      });

      it("should write the character that is contained", () => {
        const cell = new cells.TextCell(SimDataType.Character, "x");
        const buffer = Buffer.alloc(1);
        const encoder = new BinaryEncoder(buffer);
        cell.encode(encoder);
        const decoder = new BinaryDecoder(buffer);
        expect(decoder.charsUtf8(1)).to.equal("x");
      });

      it("should throw if the byte length is > 1", () => {
        const cell = new cells.TextCell(SimDataType.Character, "hello");
        const encoder = new BinaryEncoder(Buffer.alloc(5));
        expect(() => cell.encode(encoder)).to.throw();
      });
    });

    context("data type === string", () => {
      it("should write the offset that is provided", () => {
        const cell = new cells.TextCell(SimDataType.String, "hi");
        const buffer = Buffer.alloc(4);
        const encoder = new BinaryEncoder(buffer)
        cell.encode(encoder, { offset: 32 });
        const decoder = new BinaryDecoder(buffer);
        expect(decoder.uint32()).to.equal(32);
      });

      it("should throw if no offset is provided", () => {
        const cell = new cells.TextCell(SimDataType.String, "hi");
        const buffer = Buffer.alloc(4);
        const encoder = new BinaryEncoder(buffer)
        expect(() => cell.encode(encoder)).to.throw();
      });
    });

    context("data type === hashed string", () => {
      it("should write the offset that is provided and the 32-bit hash of the string", () => {
        const cell = new cells.TextCell(SimDataType.HashedString, "hi");
        const buffer = Buffer.alloc(8);
        const encoder = new BinaryEncoder(buffer)
        cell.encode(encoder, { offset: 32 });
        const decoder = new BinaryDecoder(buffer);
        expect(decoder.uint32()).to.equal(32);
        expect(decoder.uint32()).to.equal(fnv32("hi"));
      });

      it("should throw if no offset is provided", () => {
        const cell = new cells.TextCell(SimDataType.HashedString, "hi");
        const buffer = Buffer.alloc(8);
        const encoder = new BinaryEncoder(buffer)
        expect(() => cell.encode(encoder)).to.throw();
      });
    });
  });

  describe("#toXmlNode()", () => {
    // TODO:
  });

  describe("#validate()", () => {
    context("data type === character", () => {
      it("should throw if the byte length is > 1", () => {
        const cell = new cells.TextCell(SimDataType.Character, "hello");
        expect(() => cell.validate()).to.throw();
      });

      it("should throw if the byte length is < 1", () => {
        const cell = new cells.TextCell(SimDataType.Character, "");
        expect(() => cell.validate()).to.throw();
      });

      it("should not throw if the byte length is = 1", () => {
        const cell = new cells.TextCell(SimDataType.Character, "x");
        expect(() => cell.validate()).to.not.throw();
      });
    });

    context("data type === string/hashed string", () => {
      it("should not throw if string is non-empty", () => {
        const cell = new cells.TextCell(SimDataType.String, "Hi");
        expect(() => cell.validate()).to.not.throw();
      });

      it("should not throw if string is empty", () => {
        const cell = new cells.TextCell(SimDataType.String, "");
        expect(() => cell.validate()).to.not.throw();
      });
    });
  });

  describe("static#decode()", () => {
    context("data type === character", () => {
      it("should return a cell with a single character", () => {
        // TODO:
      });
    });

    context("data type === string", () => {
      it("should read an offset and the string at that offset", () => {
        // TODO:
      });
    });

    context("data type === hashed string", () => {
      it("should skip the hash, read an offset, and then read the string at that offset", () => {
        // TODO:
      });
    });
  });

  describe("static#fromXmlNode()", () => {
    // TODO:
  });

  describe("static#getDefault()", () => {
    it("should return a cell with the given data type and an empty string", () => {
      const cell = cells.TextCell.getDefault(SimDataType.String);
      expect(cell.dataType).to.equal(SimDataType.String);
      expect(cell.value).to.equal("");
    });
  });
});

describe("NumberCell", function() {
  describe("#value", () => {
    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const cell = new cells.NumberCell(SimDataType.UInt32, 100, owner);
      expect(owner.cached).to.be.true;
      cell.value = 50;
      expect(owner.cached).to.be.false;
    });
  });

  describe("#constructor()", () => {
    it("should have the given type and value", () => {
      const cell = new cells.NumberCell(SimDataType.UInt32, 100);
      expect(cell.dataType).to.equal(SimDataType.UInt32);
      expect(cell.value).to.equal(100);
    });
  });

  describe("#clone()", () => {
    it("should copy the data type and value", () => {
      const cell = new cells.NumberCell(SimDataType.Int8, 100);
      const clone = cell.clone();
      expect(clone.dataType).to.equal(SimDataType.Int8);
      expect(clone.value).to.equal(100);
    });

    it("should not copy the owner", () => {
      const owner = new MockOwner();
      const cell = new cells.NumberCell(SimDataType.Int8, 100, owner);
      const clone = cell.clone();
      expect(clone.owner).to.be.undefined;
    });

    it("should not mutate the original", () => {
      const cell = new cells.NumberCell(SimDataType.Int8, 100);
      const clone = cell.clone();
      clone.value = 50;
      expect(cell.value).to.equal(100);
    });
  });

  describe("#encode()", () => {
    it("should write Int8 in 1 byte", () => {
      const cell = new cells.NumberCell(SimDataType.Int8, -5);
      const buffer = Buffer.alloc(1);
      const encoder = new BinaryEncoder(buffer);
      expect(() => cell.encode(encoder)).to.not.throw();
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.int8()).to.equal(-5);
    });

    it("should write UInt8 in 1 byte", () => {
      const cell = new cells.NumberCell(SimDataType.UInt8, 5);
      const buffer = Buffer.alloc(1);
      const encoder = new BinaryEncoder(buffer);
      expect(() => cell.encode(encoder)).to.not.throw();
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.uint8()).to.equal(5);
    });

    it("should write Int16 in 2 bytes", () => {
      const cell = new cells.NumberCell(SimDataType.Int16, -5);
      const buffer = Buffer.alloc(2);
      const encoder = new BinaryEncoder(buffer);
      expect(() => cell.encode(encoder)).to.not.throw();
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.int16()).to.equal(-5);
    });

    it("should write UInt16 in 2 bytes", () => {
      const cell = new cells.NumberCell(SimDataType.UInt16, 5);
      const buffer = Buffer.alloc(2);
      const encoder = new BinaryEncoder(buffer);
      expect(() => cell.encode(encoder)).to.not.throw();
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.uint16()).to.equal(5);
    });

    it("should write Int32 in 4 bytes", () => {
      const cell = new cells.NumberCell(SimDataType.Int32, -5);
      const buffer = Buffer.alloc(4);
      const encoder = new BinaryEncoder(buffer);
      expect(() => cell.encode(encoder)).to.not.throw();
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.int32()).to.equal(-5);
    });

    it("should write UInt32 in 4 bytes", () => {
      const cell = new cells.NumberCell(SimDataType.UInt32, 5);
      const buffer = Buffer.alloc(4);
      const encoder = new BinaryEncoder(buffer);
      expect(() => cell.encode(encoder)).to.not.throw();
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.uint32()).to.equal(5);
    });

    it("should write LocalizationKey in 4 bytes", () => {
      const cell = new cells.NumberCell(SimDataType.LocalizationKey, 0x12345678);
      const buffer = Buffer.alloc(4);
      const encoder = new BinaryEncoder(buffer);
      expect(() => cell.encode(encoder)).to.not.throw();
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.uint32()).to.equal(0x12345678);
    });

    it("should write Float in 4 bytes", () => {
      const cell = new cells.NumberCell(SimDataType.Float, 1.75);
      const buffer = Buffer.alloc(4);
      const encoder = new BinaryEncoder(buffer);
      expect(() => cell.encode(encoder)).to.not.throw();
      const decoder = new BinaryDecoder(buffer);
      expect(decoder.float()).to.equal(1.75);
    });

    it("should throw if value is out of bounds", () => {
      const cell = new cells.NumberCell(SimDataType.UInt8, 500);
      const encoder = new BinaryEncoder(Buffer.alloc(1));
      expect(() => cell.encode(encoder)).to.throw();
    });

    it("should throw if an unsigned integer is negative", () => {
      const cell = new cells.NumberCell(SimDataType.UInt32, -10);
      const encoder = new BinaryEncoder(Buffer.alloc(4));
      expect(() => cell.encode(encoder)).to.throw();
    });
  });

  describe("#toXmlNode()", () => {
    // TODO:
  });

  describe("#validate()", () => {
    it("should throw when unsigned integer is larger than its limit", () => {
      const cell = new cells.NumberCell(SimDataType.UInt8, 256);
      expect(() => cell.validate()).to.throw();
    });

    it("should throw when unsigned integer is negative", () => {
      const cell = new cells.NumberCell(SimDataType.UInt8, -1);
      expect(() => cell.validate()).to.throw();
    });

    it("should not throw when unsigned integer is within range", () => {
      const cell = new cells.NumberCell(SimDataType.UInt8, 255);
      expect(() => cell.validate()).to.not.throw();
    });

    it("should throw when signed integer is larger than its limit", () => {
      const cell = new cells.NumberCell(SimDataType.Int8, 128);
      expect(() => cell.validate()).to.throw();
    });

    it("should throw when signed integer is lower than its limit", () => {
      const cell = new cells.NumberCell(SimDataType.Int8, -129);
      expect(() => cell.validate()).to.throw();
    });

    it("should not throw when signed integer is negative and in range", () => {
      const cell = new cells.NumberCell(SimDataType.Int8, -1);
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
        const cell = cells.NumberCell.decode(SimDataType.Int8, decoder);
        expect(cell.dataType).to.equal(SimDataType.Int8);
        expect(cell.value).to.equal(-5);
      });

      it("should read an unsigned integer", () => {
        const decoder = getDecoder(1, 'uint8', 5);
        const cell = cells.NumberCell.decode(SimDataType.UInt8, decoder);
        expect(cell.dataType).to.equal(SimDataType.UInt8);
        expect(cell.value).to.equal(5);
      });
    });

    context("data type === 16 bits", () => {
      it("should read a signed integer", () => {
        const decoder = getDecoder(2, 'int16', -5);
        const cell = cells.NumberCell.decode(SimDataType.Int16, decoder);
        expect(cell.dataType).to.equal(SimDataType.Int16);
        expect(cell.value).to.equal(-5);
      });

      it("should read an unsigned integer", () => {
        const decoder = getDecoder(2, 'uint16', 5);
        const cell = cells.NumberCell.decode(SimDataType.UInt16, decoder);
        expect(cell.dataType).to.equal(SimDataType.UInt16);
        expect(cell.value).to.equal(5);
      });
    });

    context("data type === 36 bits", () => {
      it("should read a signed integer", () => {
        const decoder = getDecoder(4, 'int32', -5);
        const cell = cells.NumberCell.decode(SimDataType.Int32, decoder);
        expect(cell.dataType).to.equal(SimDataType.Int32);
        expect(cell.value).to.equal(-5);
      });

      it("should read an unsigned integer", () => {
        const decoder = getDecoder(4, 'uint32', 5);
        const cell = cells.NumberCell.decode(SimDataType.UInt32, decoder);
        expect(cell.dataType).to.equal(SimDataType.UInt32);
        expect(cell.value).to.equal(5);
      });

      it("should read a float", () => {
        const decoder = getDecoder(4, 'float', 1.5);
        const cell = cells.NumberCell.decode(SimDataType.Float, decoder);
        expect(cell.dataType).to.equal(SimDataType.Float);
        expect(cell.value).to.equal(1.5);
      });

      it("should read a localization key", () => {
        const decoder = getDecoder(4, 'uint32', 0x12345678);
        const cell = cells.NumberCell.decode(SimDataType.LocalizationKey, decoder);
        expect(cell.dataType).to.equal(SimDataType.LocalizationKey);
        expect(cell.value).to.equal(0x12345678);
      });
    });
  });

  describe("static#fromXmlNode()", () => {
    // TODO:
  });

  describe("static#getDefault()", () => {
    // TODO:
  });
});

describe("BigIntCell", function() {
  describe("#value", () => {
    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const cell = new cells.BigIntCell(SimDataType.UInt64, 50n, owner);
      expect(owner.cached).to.be.true;
      cell.value = 25n;
      expect(owner.cached).to.be.false;
    });
  });

  describe("#constructor()", () => {
    it("should use the given data type and value", () => {
      const cell = new cells.BigIntCell(SimDataType.UInt64, 50n);
      expect(cell.dataType).to.equal(SimDataType.UInt64);
      expect(cell.value).to.equal(50n);
    });
  });

  describe("#clone()", () => {
    it("should copy the data type and value", () => {
      // TODO:
      // const cell = new cells.TextCell(SimDataType.String, "Something");
      // const clone = cell.clone();
      // expect(clone.dataType).to.equal(SimDataType.String);
      // expect(clone.value).to.equal("Something");
    });

    it("should not copy the owner", () => {
      // TODO:
      // const owner = new MockOwner();
      // const cell = new cells.TextCell(SimDataType.String, "Something", owner);
      // const clone = cell.clone();
      // expect(clone.owner).to.be.undefined;
    });

    it("should not mutate the original", () => {
      // TODO:
      // const cell = new cells.TextCell(SimDataType.String, "Something");
      // const clone = cell.clone();
      // clone.value = "Something else";
      // expect(cell.value).to.equal("Something");
    });
  });

  describe("#encode()", () => {
    // TODO:
  });

  describe("#toXmlNode()", () => {
    // TODO:
  });

  describe("#validate()", () => {
    // TODO:
  });

  describe("static#decode()", () => {
    // TODO:
  });

  describe("static#fromXmlNode()", () => {
    // TODO:
  });

  describe("static#getDefault()", () => {
    // TODO:
  });
});

describe("ResourceKeyCell", function() {
  describe("#type", () => {
    it("should uncache the owner when set", () => {
      // TODO:
    });
  });

  describe("#group", () => {
    it("should uncache the owner when set", () => {
      // TODO:
    });
  });

  describe("#instance", () => {
    it("should uncache the owner when set", () => {
      // TODO:
    });
  });

  describe("#constructor()", () => {
    // TODO:
  });

  describe("#clone()", () => {
    it("should copy the type, group, and instance", () => {
      // TODO:
      // const cell = new cells.TextCell(SimDataType.String, "Something");
      // const clone = cell.clone();
      // expect(clone.dataType).to.equal(SimDataType.String);
      // expect(clone.value).to.equal("Something");
    });

    it("should not copy the owner", () => {
      // TODO:
      // const owner = new MockOwner();
      // const cell = new cells.TextCell(SimDataType.String, "Something", owner);
      // const clone = cell.clone();
      // expect(clone.owner).to.be.undefined;
    });

    it("should not mutate the original", () => {
      // TODO:
      // const cell = new cells.TextCell(SimDataType.String, "Something");
      // const clone = cell.clone();
      // clone.value = "Something else";
      // expect(cell.value).to.equal("Something");
    });
  });

  describe("#encode()", () => {
    // TODO:
  });

  describe("#toXmlNode()", () => {
    // TODO:
  });

  describe("#validate()", () => {
    // TODO:
  });

  describe("static#decode()", () => {
    // TODO:
  });

  describe("static#fromXmlNode()", () => {
    // TODO:
  });

  describe("static#getDefault()", () => {
    // TODO:
  });
});

describe("Float2Cell", function() {
  describe("#x", () => {
    it("should uncache the owner when set", () => {
      // TODO:
    });
  });

  describe("#y", () => {
    it("should uncache the owner when set", () => {
      // TODO:
    });
  });

  describe("#constructor()", () => {
    // TODO:
  });

  describe("#clone()", () => {
    it("should copy the float values", () => {
      // TODO:
      // const cell = new cells.TextCell(SimDataType.String, "Something");
      // const clone = cell.clone();
      // expect(clone.dataType).to.equal(SimDataType.String);
      // expect(clone.value).to.equal("Something");
    });

    it("should not copy the owner", () => {
      // TODO:
      // const owner = new MockOwner();
      // const cell = new cells.TextCell(SimDataType.String, "Something", owner);
      // const clone = cell.clone();
      // expect(clone.owner).to.be.undefined;
    });

    it("should not mutate the original", () => {
      // TODO:
      // const cell = new cells.TextCell(SimDataType.String, "Something");
      // const clone = cell.clone();
      // clone.value = "Something else";
      // expect(cell.value).to.equal("Something");
    });
  });

  describe("#encode()", () => {
    // TODO:
  });

  describe("#toXmlNode()", () => {
    // TODO:
  });

  describe("#validate()", () => {
    // TODO:
  });

  describe("static#decode()", () => {
    // TODO:
  });

  describe("static#fromXmlNode()", () => {
    // TODO:
  });

  describe("static#getDefault()", () => {
    // TODO:
  });
});

describe("Float3Cell", function() {
  describe("#x", () => {
    it("should uncache the owner when set", () => {
      // TODO:
    });
  });

  describe("#y", () => {
    it("should uncache the owner when set", () => {
      // TODO:
    });
  });

  describe("#z", () => {
    it("should uncache the owner when set", () => {
      // TODO:
    });
  });

  describe("#constructor()", () => {
    // TODO:
  });

  describe("#clone()", () => {
    it("should copy the float values", () => {
      // TODO:
      // const cell = new cells.TextCell(SimDataType.String, "Something");
      // const clone = cell.clone();
      // expect(clone.dataType).to.equal(SimDataType.String);
      // expect(clone.value).to.equal("Something");
    });

    it("should not copy the owner", () => {
      // TODO:
      // const owner = new MockOwner();
      // const cell = new cells.TextCell(SimDataType.String, "Something", owner);
      // const clone = cell.clone();
      // expect(clone.owner).to.be.undefined;
    });

    it("should not mutate the original", () => {
      // TODO:
      // const cell = new cells.TextCell(SimDataType.String, "Something");
      // const clone = cell.clone();
      // clone.value = "Something else";
      // expect(cell.value).to.equal("Something");
    });
  });

  describe("#encode()", () => {
    // TODO:
  });

  describe("#toXmlNode()", () => {
    // TODO:
  });

  describe("#validate()", () => {
    // TODO:
  });

  describe("static#decode()", () => {
    // TODO:
  });

  describe("static#fromXmlNode()", () => {
    // TODO:
  });

  describe("static#getDefault()", () => {
    // TODO:
  });
});

describe("Float4Cell", function() {
  describe("#x", () => {
    it("should uncache the owner when set", () => {
      // TODO:
    });
  });

  describe("#y", () => {
    it("should uncache the owner when set", () => {
      // TODO:
    });
  });

  describe("#z", () => {
    it("should uncache the owner when set", () => {
      // TODO:
    });
  });

  describe("#w", () => {
    it("should uncache the owner when set", () => {
      // TODO:
    });
  });

  describe("#constructor()", () => {
    // TODO:
  });

  describe("#clone()", () => {
    it("should copy the float values", () => {
      // TODO:
      // const cell = new cells.TextCell(SimDataType.String, "Something");
      // const clone = cell.clone();
      // expect(clone.dataType).to.equal(SimDataType.String);
      // expect(clone.value).to.equal("Something");
    });

    it("should not copy the owner", () => {
      // TODO:
      // const owner = new MockOwner();
      // const cell = new cells.TextCell(SimDataType.String, "Something", owner);
      // const clone = cell.clone();
      // expect(clone.owner).to.be.undefined;
    });

    it("should not mutate the original", () => {
      // TODO:
      // const cell = new cells.TextCell(SimDataType.String, "Something");
      // const clone = cell.clone();
      // clone.value = "Something else";
      // expect(cell.value).to.equal("Something");
    });
  });

  describe("#encode()", () => {
    // TODO:
  });

  describe("#toXmlNode()", () => {
    // TODO:
  });

  describe("#validate()", () => {
    // TODO:
  });

  describe("static#decode()", () => {
    // TODO:
  });

  describe("static#fromXmlNode()", () => {
    // TODO:
  });

  describe("static#getDefault()", () => {
    // TODO:
  });
});

// TODO: ObjectCell, VectorCell, VariantCell
