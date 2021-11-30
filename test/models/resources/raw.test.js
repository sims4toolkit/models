const expect = require('chai').expect;
const { RawResource } = require('../../../dst/api');

function getRAW(content) {
  return RawResource.from(Buffer.from(content));
}

describe('RawResource', function() {
  describe('#variant', function() {
    it('should be "RAW" when loaded', function() {
      const raw = getRAW("file content");
      expect(raw.variant).to.equal("RAW");
    });
  });

  describe('#hasChanged', function() {
    it('should throw when trying to assign a value', function() {
      // TODO:
    });

    it('should return false', function() {
      // TODO:
    });
  });

  describe('#buffer', function() {
    it('should throw when trying to assign a value', function() {
      // TODO:
    });

    it('should return the original buffer', function() {
      // TODO:
    });
  });

  describe('#plainText', function() {
    it('should throw when trying to assign a value', function() {
      // TODO:
    });

    it('should return the plain text for a text resource', function() {
      // TODO:
    });

    it('should return the plain text for a binary resource', function() {
      // TODO:
    });
  });

  describe('#clone()', function() {
    // TODO:
  });

  describe('#from()', function() {
    // TODO:
  });

  describe('#uncache()', function() {
    it('should do nothing', function() {
      // TODO:
    });
  });
});
