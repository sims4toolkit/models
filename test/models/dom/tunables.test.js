const { expect } = require("chai");
const { StringTableResource, hashing, tunables, formatting } = require("../../../dst/api");
const { formatStringKey } = formatting;
const { fnv32 } = hashing;
const { I, M, T, E, L, U, V, C, Comment, LocString, getLocStringFn } = tunables;

describe("#I()", function() {
  it("should create a node with a <I> tag", function() {
    const node = I({ c: "Class", i: "type", m: "path", n: "name", s: 123 });
    expect(node.tag).to.equal("I");
  });

  it("should throw if any attributes are missing", function() {
    expect(() => I()).to.throw;
    expect(() => I({ i: "type", m: "path", n: "name", s: 123 })).to.throw;
    expect(() => I({ c: "Class", m: "path", n: "name", s: 123 })).to.throw;
    expect(() => I({ c: "Class", i: "type", n: "name", s: 123 })).to.throw;
    expect(() => I({ c: "Class", i: "type", m: "path", s: 123 })).to.throw;
    expect(() => I({ c: "Class", i: "type", m: "path", n: "name" })).to.throw;
  });

  it("should assign all given attributes correctly", function() {
    const node = I({ c: "Class", i: "type", m: "path", n: "name", s: 123 });
    expect(node.attributes.c).to.equal("Class");
    expect(node.attributes.i).to.equal("type");
    expect(node.attributes.m).to.equal("path");
    expect(node.name).to.equal("name");
    expect(node.id).to.equal(123);
  });

  it("should have an empty children list if none are given", function() {
    const node = I({ c: "Class", i: "type", m: "path", n: "name", s: 123 });
    expect(node.children).to.be.an('Array').that.is.empty;
  });

  it("should contain the children that are given", function() {
    const node = I({
      c: "Class", i: "type", m: "path", n: "name", s: 123,
      children: [
        T({ name: "tunable" }),
        U({ name: "tuple" }),
        L({ name: "list" })
      ]
    });

    expect(node.numChildren).to.equal(3);
    expect(node.children[0].tag).to.equal("T");
    expect(node.children[0].name).to.equal("tunable");
    expect(node.children[1].tag).to.equal("U");
    expect(node.children[1].name).to.equal("tuple");
    expect(node.children[2].tag).to.equal("L");
    expect(node.children[2].name).to.equal("list");
  });

  it("should serialize as one tag without children", function() {
    const node = I({ c: "Class", i: "type", m: "path", n: "name", s: 123 });
    expect(node.toXml()).to.equal(`<I c="Class" i="type" m="path" n="name" s="123"/>`);
  });

  it("should serialize each element child on its own line", function() {
    const node = I({
      c: "Class", i: "type", m: "path", n: "name", s: 123,
      children: [
        T({ name: "tunable" }),
        U({ name: "tuple" }),
        L({ name: "list" })
      ]
    });

    expect(node.toXml()).to.equal(`<I c="Class" i="type" m="path" n="name" s="123">
  <T n="tunable"/>
  <U n="tuple"/>
  <L n="list"/>
</I>`);
  });
});

describe("#M()", function() {
  it("should create a node with a <M> tag", function() {
    const node = M({ n: "name", s: 123 });
    expect(node.tag).to.equal("M");
  });

  it("should throw if either attribute is missing", function() {
    expect(() => M()).to.throw;
    expect(() => M({ s: 123 })).to.throw;
    expect(() => M({ n: "name" })).to.throw;
  });

  it("should assign both given attributes correctly", function() {
    const node = M({ n: "name", s: 123 });
    expect(node.name).to.equal("name");
    expect(node.id).to.equal(123);
  });

  it("should have an empty children list if none are given", function() {
    const node = M({ n: "name", s: 123 });
    expect(node.children).to.be.an('Array').that.is.empty;
  });

  it("should contain the children that are given", function() {
    const node = M({
      n: "name", s: 123,
      children: [
        C({ name: "First" }),
        C({ name: "Second" })
      ]
    });

    expect(node.numChildren).to.equal(2);
    expect(node.children[0].tag).to.equal("C");
    expect(node.children[0].name).to.equal("First");
    expect(node.children[1].tag).to.equal("C");
    expect(node.children[1].name).to.equal("Second");
  });

  it("should serialize as one tag without children", function() {
    const node = M({ n: "name", s: 123 });
    expect(node.toXml()).to.equal(`<M n="name" s="123"/>`);
  });

  it("should serialize each element child on its own line", function() {
    const node = M({
      n: "name", s: 123,
      children: [
        C({ name: "First" }),
        C({ name: "Second" })
      ]
    });

    expect(node.toXml()).to.equal(`<M n="name" s="123">
  <C n="First"/>
  <C n="Second"/>
</M>`);
  });
});

describe("#T()", function() {
  it("should create a node with a <T> tag", function() {
    const node = T();
    expect(node.tag).to.equal("T");
  });

  it("should create an empty node if no arguments are given", function() {
    const node = T();
    expect(node.numChildren).to.equal(0);
  });

  it("should assign 'name' to the 'n' attribute", function() {
    const node = T({ name: "tunable" });
    expect(node.attributes.n).to.equal("tunable");
  });

  it("should assign 'ev' to the 'ev' attribute", function() {
    const node = T({ ev: 1 });
    expect(node.attributes.ev).to.equal(1);
  });

  it("should have one child if a value is given", function() {
    const node = T({ value: 1234 });
    expect(node.numChildren).to.equal(1);
    expect(node.innerValue).to.equal(1234);
  });

  it("should have one child if a comment is given", function() {
    const node = T({ comment: "This is a comment" });
    expect(node.numChildren).to.equal(1);
    expect(node.innerValue).to.equal("This is a comment");
  });

  it("should have two children if a value and comment are given", function() {
    const node = T({ value: 1234, comment: "Some_Tunable" });
    expect(node.numChildren).to.equal(2);
    expect(node.children[0].value).to.equal(1234);
    expect(node.children[1].value).to.equal("This is a comment");
  });

  it("should serialize attributes", function() {
    const node = T({ name: "enum_value", ev: 12 });
    expect(node.toXml()).to.equal(`<T n="enum_value" ev="12"/>`);
  });

  it("should serialize without attributes", function() {
    const node = T();
    expect(node.toXml()).to.equal(`<T/>`);
  });

  it("should serialize on one line with just a value", function() {
    const node = T({ value: 123 });
    expect(node.toXml()).to.equal(`<T>123</T>`);
  });

  it("should serialize on one line with just a comment", function() {
    const node = T({ comment: "Comment" });
    expect(node.toXml()).to.equal(`<T><!--Comment--></T>`);
  });

  it("should serialize on one line with both value/comment", function() {
    const node = T({ value: 123, comment: "Comment" });
    expect(node.toXml()).to.equal(`<T>123<!--Comment--></T>`);
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
  it("should create a comment node with the given value", function() {
    const node = Comment("Hello");
    expect(node.value).to.equal("Hello");
  });

  it("should serialize with XML comment syntax", function() {
    const node = Comment("Hello");
    expect(node.toXml()).to.equal("<!--Hello-->");
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
    expect(node.child.value).to.equal(expectedValue);
    expect(node.children[1].value).to.equal(string);
  });
});

describe("#getLocStringFn()", function() {
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
    expect(node.child.value).to.equal(expectedValue);
    expect(node.children[1].value).to.equal(string);
  });
});
