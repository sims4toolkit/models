import { expect } from "chai";
import { simDataCells } from "../../../../dst/api";
import { SimDataType } from "../../../../dst/lib/models/resources/simData/simDataTypes";
import { BinaryDecoder, BinaryEncoder } from "../../../../dst/lib/utils/encoding";
import MockOwner from "../../mocks/mockOwner";

const cells = simDataCells;

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
        // TODO:
      });

      it("should throw if no offset is provided", () => {
        // TODO:
      });
    });

    context("data type === hashed string", () => {
      it("should write the offset that is provided", () => {
        // TODO:
      });

      it("should write the 32-bit hash of the string", () => {
        // TODO:
      });

      it("should throw if no offset is provided", () => {
        // TODO:
      });
    });
  });

  describe("#toXmlNode()", () => {
    // TODO:
  });

  describe("#validate()", () => {
    context("data type === character", () => {
      it("should throw if the byte length is > 1", () => {
        // TODO:
      });

      it("should throw if the byte length is < 1", () => {
        // TODO:
      });

      it("should not throw if the byte length is = 1", () => {
        // TODO:
      });
    });

    context("data type === string/hashed string", () => {
      it("should throw if the byte length is < 1", () => {
        // TODO: is this actually the desired behavior? can't it just write a null offset?
      });

      it("should not throw if the byte length is >= 1", () => {
        // TODO:
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
      // TODO:
    });
  });
});

describe("NumberCell", function() {
  describe("#value", () => {
    it("should uncache the owner when set", () => {
      // TODO:
    });
  });

  describe("#constructor()", () => {
    // TODO:
  });

  describe("#clone()", () => {
    // TODO:
  });

  describe("#encode()", () => {
    context("data type === 8 bits", () => {
      // TODO:
    });

    context("data type === 16 bits", () => {
      // TODO:
    });

    context("data type === 36 bits", () => {
      // TODO:
    });
  });

  describe("#toXmlNode()", () => {
    // TODO:
  });

  describe("#validate()", () => {
    context("data type === 8 bits", () => {
      // TODO:
    });

    context("data type === 16 bits", () => {
      // TODO:
    });

    context("data type === 36 bits", () => {
      // TODO:
    });
  });

  describe("static#decode()", () => {
    context("data type === 8 bits", () => {
      // TODO:
    });

    context("data type === 16 bits", () => {
      // TODO:
    });

    context("data type === 36 bits", () => {
      // TODO:
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
      // TODO:
    });
  });

  describe("#constructor()", () => {
    // TODO:
  });

  describe("#clone()", () => {
    // TODO:
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
    // TODO:
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
    // TODO:
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
    // TODO:
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
    // TODO:
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
