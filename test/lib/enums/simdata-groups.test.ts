import { expect } from "chai";
import { SimDataGroup, TuningResourceType } from "../../../dst/enums";

describe("SimDataGroup", () => {
  describe("#getForTuning()", () => {
    it("should get the correct group for buff by enum", () => {
      const group = SimDataGroup.getForTuning(TuningResourceType.Buff);
      expect(group).to.equal(SimDataGroup.Buff);
    });

    it("should get the correct group for buff by value", () => {
      const group = SimDataGroup.getForTuning(0x6017E896);
      expect(group).to.equal(SimDataGroup.Buff);
    });

    it("should get the correct group for trait by enum", () => {
      const group = SimDataGroup.getForTuning(TuningResourceType.Trait);
      expect(group).to.equal(SimDataGroup.Trait);
    });

    it("should get the correct group for trait by value", () => {
      const group = SimDataGroup.getForTuning(0xCB5FDDC7);
      expect(group).to.equal(SimDataGroup.Trait);
    });
  });
});
