import { Sims4Package } from "../../dst/api";
import { expect } from "chai";

describe("ResourceEntry", () => {
  //#region Properties

  describe("#buffer", () => {
    it("should serialize and compress the contained resource", () => {
      // TODO:
    });

    it("should return the cached buffer if it wasn't changed", () => {
      // TODO:
    });
  });

  // #hasChanged tested by other tests

  describe("#key", () => {
    it("should uncache the dbpf when set", () => {
      // TODO:
    });

    it("should uncache the dbpf when mutated", () => {
      // TODO:
    });

    it("should not uncache the entry when mutated", () => {
      // TODO:
    });

    it("should not uncache the entry's resource when mutated", () => {
      // TODO:
    });
  });

  // #isCached tested by other tests

  describe("#value", () => {
    it("should uncache the dbpf when set", () => {
      // TODO:
    });

    it("should uncache the dbpf when mutated", () => {
      // TODO:
    });

    it("should uncache the entry when mutated", () => {
      // TODO:
    });

    it("should uncache the entry's resource when mutated", () => {
      // TODO:
    });
  });

  //#endregion Properties

  //#region Public Methods

  describe("#clone()", () => {
    it("should return an entry that is equal", () => {
      // TODO:
    });

    it("should not mutate the original", () => {
      // TODO:
    });

    it("should not copy the owner", () => {
      // TODO:
    });
  });

  describe("#equals()", () => {
    it("should return true when key and value are the same", () => {
      // TODO:
    });

    it("should return false when key is different", () => {
      // TODO:
    });

    it("should return false when value is different", () => {
      // TODO:
    });

    it("should return false when other is undefined", () => {
      // TODO:
    });
  });

  describe("#keyEquals()", () => {
    it("should return true when key is the same object", () => {
      // TODO:
    });

    it("should return true when key is a different object, but identical", () => {
      // TODO:
    });

    it("should return false when keys have different type", () => {
      // TODO:
    });

    it("should return false when keys have different group", () => {
      // TODO:
    });

    it("should return false when keys have different instance", () => {
      // TODO:
    });
  });

  describe("#uncache()", () => {
    it("should uncache the owning dbpf", () => {
      // TODO:
    });

    it("should reset the compressed buffer", () => {
      // TODO:
    });

    it("should not uncache other entries in the dbpf", () => {
      // TODO:
    });

    it("should not uncache the contained resource", () => {
      // TODO:
    });
  });

  describe("#validate()", () => {
    it("should not throw when key and string are valid", () => {
      // TODO:
    });

    it("should throw if key type is negative", () => {
      // TODO:
    });

    it("should throw if key group is negative", () => {
      // TODO:
    });

    it("should throw if key instance is negative", () => {
      // TODO:
    });

    it("should throw if key type is > 32 bit", () => {
      // TODO:
    });

    it("should throw if key group is > 32 bit", () => {
      // TODO:
    });

    it("should throw if key instance is > 64 bit", () => {
      // TODO:
    });

    it("should throw if contained resource is invalid", () => {
      // TODO:
    });
  });

  //#endregion Public Methods
});
