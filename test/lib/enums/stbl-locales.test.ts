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
});
