import { expect } from "chai";
import { TuningResourceType } from "../../../dst/enums";

describe("TuningResourceType", () => {
  describe("#parseAttr()", () => {
    it("should parse relbits correctly", () => {
      const type = TuningResourceType.parseAttr("relbit");
      expect(type).to.equal(TuningResourceType.RelationshipBit);
    });

    it("should parse single-token type correctly", () => {
      const type = TuningResourceType.parseAttr("action");
      expect(type).to.equal(TuningResourceType.Action);
    });

    it("should parse two-token type correctly", () => {
      const type = TuningResourceType.parseAttr("career_gig");
      expect(type).to.equal(TuningResourceType.CareerGig);
    });

    it("should parse three-token type correctly", () => {
      const type = TuningResourceType.parseAttr("club_interaction_group");
      expect(type).to.equal(TuningResourceType.ClubInteractionGroup);
    });

    it("should return Tuning if unknown", () => {
      const type = TuningResourceType.parseAttr("abcdefg");
      expect(type).to.equal(TuningResourceType.Tuning);
    });
  });

  describe("#getAttr()", () => {
    it("should parse relbits correctly", () => {
      const type = TuningResourceType.getAttr(TuningResourceType.RelationshipBit);
      expect(type).to.equal("relbit");
    });

    it("should parse single-token type correctly", () => {
      const type = TuningResourceType.getAttr(TuningResourceType.Action);
      expect(type).to.equal("action");
    });

    it("should parse two-token type correctly", () => {
      const type = TuningResourceType.getAttr(TuningResourceType.CareerGig);
      expect(type).to.equal("career_gig");
    });

    it("should parse three-token type correctly", () => {
      const type = TuningResourceType.getAttr(TuningResourceType.ClubInteractionGroup);
      expect(type).to.equal("club_interaction_group");
    });

    it("should return null if Tuning", () => {
      const type = TuningResourceType.getAttr(TuningResourceType.Tuning);
      expect(type).to.be.null;
    });

    it("should return null if unknown", () => {
      const type = TuningResourceType.getAttr(0);
      expect(type).to.be.null;
    });
  });
});
