const { expect } = require("chai");
const { StringTableResource, hashing, tunables } = require("../../../dst/api");
const { fnv32 } = hashing;
const { I, M, T, E, L, U, V, C, Comment, LocString, getLocStringFn } = tunables;

describe("#I()", function() {
  it("should create a node with a <I> tag", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should throw if any attributes are missing", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should assign all given attributes correctly", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should have an empty children list if none are given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should contain the children that are given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize as one tag without children", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize each element child on its own line", function() {
    expect(true).to.be.false; // TODO:
  });
});

describe("#M()", function() {
  it("should create a node with a <M> tag", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should throw if any attributes are missing", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should assign all given attributes correctly", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should have an empty children list if none are given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should contain the children that are given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize as one tag without children", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize each element child on its own line", function() {
    expect(true).to.be.false; // TODO:
  });
});

describe("#T()", function() {
  it("should create a node with a <T> tag", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should create an empty node if no arguments are given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should assign 'name' to the 'n' attribute", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should assign 'ev' to the 'ev' attribute", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should have one child if a value is given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should have one child if a comment is given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should have two children if a value and comment are given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize attributes", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize without attributes", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize as one tag without value/comment", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize on one line with just a value", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize on one line with just a comment", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize on one line with both value/comment", function() {
    expect(true).to.be.false; // TODO:
  });
});

describe("#E()", function() {
  it("should create a node with a <E> tag", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should create an empty node if no arguments are given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should assign 'name' to the 'n' attribute", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should have one child if a value is given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should have one child if a comment is given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should have two children if a value and comment are given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize attributes", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize without attributes", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize as one tag without value/comment", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize on one line with just a value", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize on one line with just a comment", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize on one line with both value/comment", function() {
    expect(true).to.be.false; // TODO:
  });
});

describe("#L()", function() {
  it("should create a node with a <L> tag", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should create an empty node if no arguments are given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should have the name that is given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should have an empty children list if none are given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should contain the children that are given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize on one line if there are no children", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize each child on its own line", function() {
    expect(true).to.be.false; // TODO:
  });
});

describe("#U()", function() {
  it("should create a node with a <U> tag", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should create an empty node if no arguments are given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should have the name that is given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should have an empty children list if none are given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should contain the children that are given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize on one line if there are no children", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize each child on its own line", function() {
    expect(true).to.be.false; // TODO:
  });
});

describe("#V()", function() {
  it("should create a node with a <V> tag", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should create an empty node if no arguments are given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should have the name and type that are given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should have an empty children list if one isn't given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should contain the child that is given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize on one line if there is no child", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize child on its own line", function() {
    expect(true).to.be.false; // TODO:
  });
});

describe("#C()", function() {
  it("should create a node with a <C> tag", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should create an empty node if no arguments are given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should have the name that is given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should have an empty children list if none are given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should contain the children that are given", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize on one line if there are no children", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize each child on its own line", function() {
    expect(true).to.be.false; // TODO:
  });
});

describe("#Comment()", function() {
  it("should create a comment node", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should contain comment value", function() {
    expect(true).to.be.false; // TODO:
  });

  it("should serialize with XML comment syntax", function() {
    expect(true).to.be.false; // TODO:
  });
});

describe("#LocString()", function() {
  it('should create a node with the "T" tag', function() {
    const stbl = StringTableResource.create();
    const node = LocString({ string: 'Test', stbl });
    expect(node.tag).to.equal('T');
  });

  it('should add the strings to the string table', function() {
    const stbl = StringTableResource.create();

    L({
      children: [
        LocString({ string: 'First', stbl }),
        LocString({ string: 'Second', stbl }),
        LocString({ string: 'Third', stbl }),
      ]
    });

    expect(stbl).to.have.lengthOf(3);
    expect(stbl.entries[0].string).to.equal('First');
    expect(stbl.entries[1].string).to.equal('Second');
    expect(stbl.entries[2].string).to.equal('Third');
  });

  it('should hash the string if no alternative is given', function() {
    const stbl = StringTableResource.create();
    const string = "Some String";
    LocString({ string, stbl });
    expect(stbl.entries[0].key).to.equal(fnv32(string));
  });

  it('should hash the toHash argument if given', function() {
    const stbl = StringTableResource.create();
    const string = "Some String";
    const toHash = "Something else to hash";
    LocString({ string, toHash, stbl });
    expect(stbl.entries[0].key).to.equal(fnv32(toHash));
  });

  it('should return a tunable with a name, value, and comment', function() {
    const stbl = StringTableResource.create();
    const name = "tunable_name";
    const string = "Something";
    const node = LocString({ name, string, stbl });
    expect(node.attributes.n).to.equal(name);
    const expectedValue = formatStringKey(fnv32(string));
    expect(node.value).to.equal(expectedValue);
    expect(node.comment).to.equal(string);
  });
});

describe("#getLocString()", function() {
  it('should create a node with the "T" tag', function() {
    const stbl = StringTableResource.create();
    const S = getLocStringFn(stbl);
    const node = S({ string: 'Test' });
    expect(node.tag).to.equal('T');
  });

  it('should add the strings to the string table', function() {
    const stbl = StringTableResource.create();
    const S = getLocStringFn(stbl);

    L({
      children: [
        S({ string: 'First' }),
        S({ string: 'Second' }),
        S({ string: 'Third' }),
      ]
    });

    expect(stbl).to.have.lengthOf(3);
    expect(stbl.entries[0].string).to.equal('First');
    expect(stbl.entries[1].string).to.equal('Second');
    expect(stbl.entries[2].string).to.equal('Third');
  });

  it('should hash the string if no alternative is given', function() {
    const stbl = StringTableResource.create();
    const S = getLocStringFn(stbl);
    const string = "Some String";
    S({ string });
    expect(stbl.entries[0].key).to.equal(fnv32(string));
  });

  it('should hash the toHash argument if given', function() {
    const stbl = StringTableResource.create();
    const S = getLocStringFn(stbl);
    const string = "Some String";
    const toHash = "Something else to hash";
    S({ string, toHash });
    expect(stbl.entries[0].key).to.equal(fnv32(toHash));
  });

  it('should return a tunable with a name, value, and comment', function() {
    const stbl = StringTableResource.create();
    const S = getLocStringFn(stbl);
    const name = "tunable_name";
    const string = "Something";
    const node = S({ name, string });
    expect(node.attributes.n).to.equal(name);
    const expectedValue = formatStringKey(fnv32(string));
    expect(node.value).to.equal(expectedValue);
    expect(node.comment).to.equal(string);
  });
});
