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

  describe('#reason', function() {
    // TODO:
  });

  describe('#clone()', function() {
    // TODO:
  });

  describe('#from()', function() {
    // TODO:
  });

  describe('#getPlainText()', function() {
    // TODO:
  });

  describe('#hasChanged()', function() {
    // TODO:
  });

  describe('#getBuffer()', function() {
    // TODO:
  });
});
