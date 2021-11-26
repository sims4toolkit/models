const { expect } = require('chai');
const { tunables, hashing, formatting, StringTableResource } = require('../../dst/api');
const { formatStringKey } = formatting;
const { fnv32 } = hashing;
const { I, M, T, E, V, U, L, C, S, getStringNodeFunction } = tunables;

// TunableNode is just meant to be used as a type, it is not part of the API,
// so it does not need to be tested. It is an abstract class that is a base for
// the objects that result from the tunable node functions

describe('tunables', function() {
  describe('#I()', function() {
    it('should create a node with the same attributes', function() {
      // TODO:
    });

    it('should create a node with no children if none are given', function() {
      // TODO:
    });

    it('should create a node with the given children', function() {
      // TODO:
    });

    it('should create a node with the given comment', function() {
      // TODO:
    });

    describe('#fromXml()', function() {
      // TODO:
    });

    describe('#toXml()', function() {
      // TODO:
    });

    // TODO: remainder of functions for dom manipulation
  });

  describe('#M()', function() {
    it('should create a node with the same attributes', function() {
      // TODO:
    });

    it('should create a node with no children if none are given', function() {
      // TODO:
    });

    it('should create a node with the given children', function() {
      // TODO:
    });

    it('should create a node with the given comment', function() {
      // TODO:
    });

    describe('#fromXml()', function() {
      // TODO:
    });

    describe('#toXml()', function() {
      // TODO:
    });

    // TODO: remainder of functions for dom manipulation
  });

  describe('#T()', function() {
    it('should create a node with the given name', function() {
      // TODO:
    });

    it('should create a node with the given ev', function() {
      // TODO:
    });

    it('should create a node with the given value', function() {
      // TODO:
    });

    it('should create a node with the given comment', function() {
      // TODO:
    });

    describe('#fromXml()', function() {
      // TODO:
    });

    describe('#toXml()', function() {
      // TODO:
    });

    // TODO: remainder of functions for dom manipulation
  });

  describe('#E()', function() {
    it('should create a node with the given name', function() {
      // TODO:
    });

    it('should create a node with the given value', function() {
      // TODO:
    });

    it('should create a node with the given comment', function() {
      // TODO:
    });

    describe('#fromXml()', function() {
      // TODO:
    });

    describe('#toXml()', function() {
      // TODO:
    });

    // TODO: remainder of functions for dom manipulation
  });

  describe('#V()', function() {
    it('should create a node with the given name', function() {
      // TODO:
    });

    it('should create a node with the given type', function() {
      // TODO:
    });

    it('should create a node with no children if none are given', function() {
      // TODO:
    });

    it('should create a node with one child if a child is given', function() {
      // TODO:
    });

    it('should create a node with the given comment', function() {
      // TODO:
    });

    describe('#fromXml()', function() {
      // TODO:
    });

    describe('#toXml()', function() {
      // TODO:
    });

    // TODO: remainder of functions for dom manipulation
  });

  describe('#U()', function() {
    it('should create a node with the given name', function() {
      // TODO:
    });

    it('should create a node with no children if none are given', function() {
      // TODO:
    });

    it('should create a node with the given children', function() {
      // TODO:
    });

    it('should create a node with the given comment', function() {
      // TODO:
    });

    describe('#fromXml()', function() {
      // TODO:
    });

    describe('#toXml()', function() {
      // TODO:
    });

    // TODO: remainder of functions for dom manipulation
  });

  describe('#L()', function() {
    it('should create a node with the given name', function() {
      // TODO:
    });

    it('should create a node with no children if none are given', function() {
      // TODO:
    });

    it('should create a node with the given children', function() {
      // TODO:
    });

    it('should create a node with the given comment', function() {
      // TODO:
    });

    describe('#fromXml()', function() {
      // TODO:
    });

    describe('#toXml()', function() {
      // TODO:
    });

    // TODO: remainder of functions for dom manipulation
  });

  describe('#C()', function() {
    it('should create a node with the given name', function() {
      // TODO:
    });

    it('should create a node with no children if none are given', function() {
      // TODO:
    });

    it('should create a node with the given children', function() {
      // TODO:
    });

    it('should create a node with the given comment', function() {
      // TODO:
    });

    describe('#fromXml()', function() {
      // TODO:
    });

    describe('#toXml()', function() {
      // TODO:
    });

    // TODO: remainder of functions for dom manipulation
  });

  describe('#S()', function() {
    it('should add the strings to the string table', function() {
      const stbl = StringTableResource.create();

      L({
        children: [
          S({ string: 'First', stbl }),
          S({ string: 'Second', stbl }),
          S({ string: 'Third', stbl }),
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
      S({ string, stbl });
      expect(stbl.entries[0].key).to.equal(fnv32(string));
    });

    it('should hash the toHash argument if given', function() {
      const stbl = StringTableResource.create();
      const string = "Some String";
      const toHash = "Something else to hash";
      S({ string, toHash, stbl });
      expect(stbl.entries[0].key).to.equal(fnv32(toHash));
    });

    it('should return a tunable with a name, value, and comment', function() {
      const stbl = StringTableResource.create();
      const name = "tunable_name";
      const string = "Something";
      const node = S({ name, string, stbl });
      expect(node.attributes.n).to.equal(name);
      const expectedValue = formatStringKey(fnv32(string));
      expect(node.value).to.equal(expectedValue);
      expect(node.comment).to.equal(string);
    });
  });

  describe('#getStringNodeFunction()', function() {
    it('should add the strings to the string table', function() {
      const stbl = StringTableResource.create();
      const S = getStringNodeFunction(stbl);

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
      const S = getStringNodeFunction(stbl);
      const string = "Some String";
      S({ string });
      expect(stbl.entries[0].key).to.equal(fnv32(string));
    });

    it('should hash the toHash argument if given', function() {
      const stbl = StringTableResource.create();
      const S = getStringNodeFunction(stbl);
      const string = "Some String";
      const toHash = "Something else to hash";
      S({ string, toHash });
      expect(stbl.entries[0].key).to.equal(fnv32(toHash));
    });

    it('should return a tunable with a name, value, and comment', function() {
      const stbl = StringTableResource.create();
      const S = getStringNodeFunction(stbl);
      const name = "tunable_name";
      const string = "Something";
      const node = S({ name, string });
      expect(node.attributes.n).to.equal(name);
      const expectedValue = formatStringKey(fnv32(string));
      expect(node.value).to.equal(expectedValue);
      expect(node.comment).to.equal(string);
    });
  });
});
