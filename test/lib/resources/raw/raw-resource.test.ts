import { expect } from "chai";
import { CompressionType, EncodingType } from "../../../../dst/enums";
import { RawResource, StringTableResource } from '../../../../dst/models';

function getRAW(content = "default content") {
  return RawResource.from(Buffer.from(content));
}

describe('RawResource', function() {
  describe('#encodingType', function() {
    it('should be "RAW" when loaded', function() {
      const raw = getRAW("file content");
      expect(raw.encodingType).to.equal(EncodingType.Unknown);
    });
  });

  describe("#compressionType", () => {
    it("should be ZLIB, if not provided", () => {
      const raw = RawResource.from(Buffer.from("hello"));
      expect(raw.compressionType).to.equal(CompressionType.ZLIB);
    });

    it("should be the format that is provided", () => {
      const raw = RawResource.from(Buffer.from("hello"), {
        compressionType: CompressionType.InternalCompression
      });
      expect(raw.compressionType).to.equal(CompressionType.InternalCompression);
    });
  });

  describe("#isCompressed", () => {
    it("should be false, if not provided", () => {
      const raw = RawResource.from(Buffer.from("hello"));
      expect(raw.isCompressed).to.be.false;
    });

    it("should be true if given true", () => {
      const raw = RawResource.from(Buffer.from("hello"), {
        isCompressed: true
      });
      expect(raw.isCompressed).to.be.true;
    });
  });

  describe("#sizeDecompressed", () => {
    it("should be the byte size of the original buffer, if not provided", () => {
      const raw = RawResource.from(Buffer.from("héllo"));
      expect(raw.sizeDecompressed).to.equal(6);
    });

    it("should be the value that is given", () => {
      const raw = RawResource.from(Buffer.from("héllo"), {
        sizeDecompressed: 10
      });
      expect(raw.sizeDecompressed).to.equal(10);
    });
  });

  describe('#reason', function() {
    it('should be undefined if no reason is given', function() {
      const raw = getRAW();
      expect(raw.reason).to.be.undefined;
    });

    it('should return the reason why this resource is raw', function() {
      const raw = RawResource.from(Buffer.from("hello"), {
        reason: "Just because!"
      });
      expect(raw.reason).to.equal("Just because!");
    });
  });

  describe('#buffer', function() {
    it('should not be assignable', function() {
      const raw = getRAW();
      //@ts-expect-error The whole point is that it's an error
      expect(() => raw.buffer = Buffer.from("hi")).to.throw();
    });

    it('should return the original buffer', function() {
      const raw = getRAW("hello");
      expect(raw.buffer.toString()).to.equal("hello");
    });
  });

  describe('#plainText', function() {
    it('should not be assignable', function() {
      const raw = getRAW();
      //@ts-expect-error The whole point is that it's an error
      expect(() => raw.plainText = "hello").to.throw();
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

  describe("#saveBuffer", () => {
    it("should be true", () => {
      const raw = RawResource.from(Buffer.from("hello"));
      expect(raw.saveBuffer).to.be.true;
    });

    it("should not do anything when set", () => {
      const raw = RawResource.from(Buffer.from("hello"));
      raw.saveBuffer = false;
      expect(raw.saveBuffer).to.be.true;
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

  describe('#onChange()', function() {
    it('should do nothing', function() {
      const raw = getRAW("hello");
      expect(raw.plainText).to.equal("hello");
      expect(raw.buffer.toString()).to.equal("hello");
      expect(() => raw.onChange()).to.not.throw();
      expect(raw.plainText).to.equal("hello");
      expect(raw.buffer.toString()).to.equal("hello");
    });

    it('should not uncache the buffer', function() {
      const buffer = Buffer.from("hello");
      const raw = RawResource.from(buffer);
      expect(raw.isCached).to.be.true;
      raw.onChange();
      expect(raw.isCached).to.be.true;
      expect(buffer).to.equal(raw.buffer);
    });
  });
});
