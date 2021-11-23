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
