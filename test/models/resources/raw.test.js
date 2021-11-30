const expect = require('chai').expect;
const { RawResource, StringTableResource } = require('../../../dst/api');

function getRAW(content = "default content") {
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
      const raw = getRAW();
      expect(() => raw.hasChanged = true).to.throw;
    });

    it('should return false', function() {
      const raw = getRAW();
      expect(raw.hasChanged).to.be.false;
    });
  });

  describe('#buffer', function() {
    it('should throw when trying to assign a value', function() {
      const raw = getRAW();
      expect(() => raw.buffer = Buffer.from("hi")).to.throw;
    });

    it('should return the original buffer', function() {
      const raw = getRAW("hello");
      expect(raw.buffer.toString()).to.equal("hello");
    });
  });

  describe('#plainText', function() {
    it('should throw when trying to assign a value', function() {
      const raw = getRAW();
      expect(() => raw.plainText = "hello").to.throw;
    });

    it('should return the plain text for a text resource', function() {
      const raw = getRAW("hello");
      expect(raw.plainText).to.equal("hello");
    });

    it('should return the plain text for a binary resource', function() {
      const stbl = StringTableResource.create();
      stbl.addAndHash("test");
      const raw = RawResource.from(stbl.buffer);
      expect(raw.plainText.startsWith("STBL")).to.be.true;
    });
  });

  describe('#clone()', function() {
    it('should create another raw resource with the same content', function () {
      const raw = getRAW("hello");
      const clone = raw.clone();
      expect(clone.plainText).to.equal(raw.plainText);
    });
  });

  describe('#from()', function() {
    it('should create a new raw resource from the given buffer', function() {
      const buffer = Buffer.from("hello world");
      const raw = RawResource.from(buffer);
      expect(raw.buffer.toString()).to.equal("hello world");
    });
  });

  describe('#uncache()', function() {
    it('should do nothing', function() {
      const raw = getRAW("hello");
      expect(raw.plainText).to.equal("hello");
      expect(raw.buffer.toString()).to.equal("hello");
      expect(() => raw.uncache()).to.not.throw;
      expect(raw.plainText).to.equal("hello");
      expect(raw.buffer.toString()).to.equal("hello");
    });
  });
});
