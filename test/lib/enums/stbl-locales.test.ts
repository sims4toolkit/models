import { expect } from "chai";
import { StringTableLocale } from "../../../dst/enums";

describe("StringTableLocale", () => {
  describe("#setHighByte()", () => {
    it("should set the high byte for English/0n correctly", () => {
      const original = 0n;
      const inst = StringTableLocale.setHighByte(StringTableLocale.English, original);
      expect(inst).to.equal(0x0000000000000000n);
    });

    it("should set the high byte for Italian/0n correctly", () => {
      const original = 0n;
      const inst = StringTableLocale.setHighByte(StringTableLocale.Italian, original);
      expect(inst).to.equal(0x0B00000000000000n);
    });

    it("should set the high byte for Spanish/0n correctly", () => {
      const original = 0n;
      const inst = StringTableLocale.setHighByte(StringTableLocale.Spanish, original);
      expect(inst).to.equal(0x1300000000000000n);
    });

    it("should set the high byte for English/non-zero instance correctly", () => {
      const original = 0x4522A82C94D66CD3n;
      const inst = StringTableLocale.setHighByte(StringTableLocale.English, original);
      expect(inst).to.equal(0x0022A82C94D66CD3n);
    });

    it("should set the high byte for Italian/non-zero instance correctly", () => {
      const original = 0x4522A82C94D66CD3n;
      const inst = StringTableLocale.setHighByte(StringTableLocale.Italian, original);
      expect(inst).to.equal(0x0B22A82C94D66CD3n);
    });

    it("should set the high byte for Spanish/non-zero instance correctly", () => {
      const original = 0x4522A82C94D66CD3n;
      const inst = StringTableLocale.setHighByte(StringTableLocale.Spanish, original);
      expect(inst).to.equal(0x1322A82C94D66CD3n);
    });
  });

  describe("#getLocale()", () => {
    it("should return English when high byte is 0x00", () => {
      const locale = StringTableLocale.getLocale(0x0022A82C94D66CD3n);
      expect(locale).to.equal(StringTableLocale.English);
    });

    it("should return Italian when high byte is 0x0B", () => {
      const locale = StringTableLocale.getLocale(0x0B22A82C94D66CD3n);
      expect(locale).to.equal(StringTableLocale.Italian);
    });

    it("should return Spanish when high byte is 0x13", () => {
      const locale = StringTableLocale.getLocale(0x1322A82C94D66CD3n);
      expect(locale).to.equal(StringTableLocale.Spanish);
    });
  });
});
