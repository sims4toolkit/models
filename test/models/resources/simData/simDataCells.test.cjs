const { expect } = require("chai");
const cells = require("../../../../dst/api").simDataCells;

describe("Cell", function() {
  describe("static#parseXmlNode()", function() {
    it("should be implemented", () => {
      expect(true).to.be.false; // TODO:
    });
  });
});

describe("BooleanCell", function() {
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

describe("TextCell", function() {
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
