import { expect } from "chai";
import { simDataTypes } from "../../../dst/api";
const { SimDataType, SimDataTypeUtils } = simDataTypes;

describe("SimDataTypeUtils", () => {
  describe("#parseNumber()", () => {
    function parseInt32(value: any): number {
      return SimDataTypeUtils.parseNumber(value, SimDataType.Int32);
    }

    function parseFloat(value: any): number {
      return SimDataTypeUtils.parseNumber(value, SimDataType.Float);
    }

    function parseLocKey(value: any): number {
      return SimDataTypeUtils.parseNumber(value, SimDataType.LocalizationKey);
    }

    it("should parse a positive integer", () => {
      expect(parseInt32(15)).to.equal(15);
    });

    it("should parse a negative integer", () => {
      expect(parseInt32(-15)).to.equal(-15);
    });

    it("should parse a positive integer from a string", () => {
      expect(parseInt32("15")).to.equal(15);
    });

    it("should parse a negative integer from a string", () => {
      expect(parseInt32("-15")).to.equal(-15);
    });

    it("should parse a positive float", () => {
      expect(parseFloat(1.5)).to.equal(1.5);
    });

    it("should parse a negative float", () => {
      expect(parseFloat(-1.5)).to.equal(-1.5);
    });

    it("should parse a positive float from a string", () => {
      expect(parseFloat("1.5")).to.equal(1.5);
    });

    it("should parse a negative float from a string", () => {
      expect(parseFloat("-1.5")).to.equal(-1.5);
    });

    it("should parse an integer for a loc key", () => {
      expect(parseLocKey(0x12345678)).to.equal(0x12345678);
    });

    it("should parse a string for a loc key", () => {
      expect(parseLocKey("0x12345678")).to.equal(0x12345678);
    });

    it("should use a value of 0 if it's undefined", () => {
      expect(parseInt32(undefined)).to.equal(0);
    });

    it("should use a value of 0 if it's null", () => {
      expect(parseInt32(null)).to.equal(0);
    });

    it("should return NaN if the inner value is NaN", () => {
      expect(parseInt32(NaN)).to.be.NaN;
    });

    it("should return NaN if the inner value cannot be parsed as a number", () => {
      expect(parseInt32("hello")).to.be.NaN;
    });
  });
});
