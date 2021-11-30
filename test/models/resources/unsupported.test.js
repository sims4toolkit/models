const expect = require('chai').expect;
const { UnsupportedResource } = require('../../../dst/api');

function getUnsupported(content) {
  return UnsupportedResource.from(Buffer.from(content));
}

describe('UnsupportedResource', function() {
  describe('#variant', function() {
    it('should be undefined when loaded', function() {
      const file = getUnsupported("file content");
      expect(file.variant).to.be.undefined;
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

  describe('#reason', function() {
    it('should return undefined if no reason was given', function() {
      // TODO:
    });

    it('should return the reason this resource is undefined', function() {
      // TODO:
    });
  });

  describe('#clone()', function() {
    // TODO:
  });

  describe('#from()', function() {
    // TODO:
  });

  describe('#toRaw()', function() {
    // TODO:
  });

  describe('#uncache()', function() {
    it('should do nothing', function() {
      // TODO:
    });
  });
});
