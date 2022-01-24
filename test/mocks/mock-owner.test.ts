import { expect } from "chai";
import MockOwner from "./mock-owner";

describe("MockOwner", function() {
  it("should be cached when initialized", () => {
    const owner = new MockOwner();
    expect(owner.cached).to.be.true;
  });

  it("should be uncached when uncache() is called", () => {
    const owner = new MockOwner();
    owner.uncache();
    expect(owner.cached).to.be.false;
  });
});
