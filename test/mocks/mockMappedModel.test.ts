import { expect } from "chai";
import MockMappedModel from "./mockMappedModel";

function mockWithEntries(): MockMappedModel {
  return new MockMappedModel([
    { key: 1234, value: "hi" },
    { key: 5678, value: "bye" }
  ]);
}

describe("MockMappedModel", () => {
  describe("#entries", () => {
    it("should return the entries in an array", () => {
      const model = mockWithEntries();
      expect(model.entries).to.be.an('Array').with.lengthOf(2);
      const [ first, second ] = model.entries;
      expect(first.key).to.equal(1234);
      expect(first.value).to.equal("hi");
      expect(second.key).to.equal(5678);
      expect(second.value).to.equal("bye");
    });

    it("should not mutate the internal iterable", () => {
      const model = mockWithEntries();
      const entries = model.entries;
      entries.splice(0, 1);
      expect(model.entries).to.equal(entries);
      expect(model.size).to.equal(2);
    });

    it("should be the same object when accessed more than once without changes", () => {
      const model = mockWithEntries();
      const entries = model.entries;
      expect(model.entries).to.equal(entries);
    });

    it("should be a new object when an entry is added", () => {
      const model = mockWithEntries();
      const entries = model.entries;
      model.add(2468, "ciao");
      expect(model.entries).to.not.equal(entries);
    });

    it("should be a new object when an entry is mutated", () => {
      const model = mockWithEntries();
      const entries = model.entries;
      entries[0].key = 2468;
      expect(model.entries).to.not.equal(entries);
    });

    it("should be a new object when an entry is removed", () => {
      const model = mockWithEntries();
      const entries = model.entries;
      model.delete(0);
      expect(model.entries).to.not.equal(entries);
    });
  });

  describe("#size", () => {
    it("should return 0 if this model is empty", () => {
      const model = new MockMappedModel();
      expect(model.size).to.equal(0);
    });

    it("should return the number of entries in this model", () => {
      const model = mockWithEntries();
      expect(model.size).to.equal(2);
    });
  });

  describe("#constructor", () => {
    it("should create new objects for all of the given entries", () => {
      // TODO:
    });

    it("should set itself as the owner of all created entries", () => {
      // TODO:
    });

    it("should not set itself as the owner of the given entries", () => {
      // TODO:
    });

    it("should advance the value of nextId", () => {
      // TODO:
    });

    it("should use the owner that is given", () => {
      // TODO:
    });

    it("should have an undefined owner if none is given", () => {
      // TODO:
    });
  });

  describe("#add()", () => {
    it("should return the object that was created", () => {
      // TODO:
    });

    it("should add an entry with the given key and value", () => {
      // TODO:
    });

    it("should assign a unique ID to the created object", () => {
      // TODO:
    });

    // TODO: more tests

    it("should uncache this model", () => {
      // TODO:
    });

    it("should uncache the owner", () => {
      // TODO:
    });
  });

  describe("#clear()", () => {
    it("should delete all entries", () => {
      // TODO:
    });

    it("should delete all entries", () => {
      // TODO:
    });

    it("should uncache this model", () => {
      // TODO:
    });

    it("should uncache the owner", () => {
      // TODO:
    });
  });

  describe("#delete()", () => {
    // TODO:
  });

  describe("#deleteByKey()", () => {
    // TODO:
  });

  describe("#get()", () => {
    // TODO:
  });

  describe("#getByKey()", () => {
    // TODO:
  });

  describe("#getIdForKey()", () => {
    // TODO:
  });

  describe("#getIdsForKey()", () => {
    // TODO:
  });

  describe("#hasKey()", () => {
    // TODO:
  });

  describe("#merge()", () => {
    // TODO:
  });

  describe("#uncache()", () => {
    // TODO:
  });

  describe("#validate()", () => {
    // TODO:
  });
});

describe("MockEntry", () => {
  describe("#key", () => {
    // TODO:
  });

  describe("#value", () => {
    // TODO:
  });

  describe("#keyEquals()", () => {
    // TODO:
  });
});
