import { expect } from "chai";
import { compressBuffer, CompressedBuffer, CompressionType } from "@s4tk/compression";
import { EncodingType } from "../../../../dst/enums";
import { RawResource } from '../../../../dst/models';
import MockOwner from "../../../mocks/mock-owner";

describe('RawResource', function () {
  const UNCOMPRESSED_BUFFER_CACHE: CompressedBuffer = {
    buffer: Buffer.from("hi"),
    compressionType: CompressionType.Uncompressed,
    sizeDecompressed: 2
  };

  const ZLIB_BUFFER_CACHE: CompressedBuffer = {
    buffer: compressBuffer(Buffer.from("hi"), CompressionType.ZLIB),
    compressionType: CompressionType.ZLIB,
    sizeDecompressed: 2
  };

  //#region Properties

  describe('#encodingType', function () {
    it('should be "Unknown" when loaded', function () {
      const raw = RawResource.from(Buffer.from("file content"));
      expect(raw.encodingType).to.equal(EncodingType.Unknown);
    });
  });

  describe('#reason', function () {
    it('should be undefined if no reason is given', function () {
      const raw = RawResource.from(Buffer.from("file content"));
      expect(raw.reason).to.be.undefined;
    });

    it('should return the reason why this resource is raw', function () {
      const raw = RawResource.from(Buffer.from("file content"), {
        reason: "Just because!"
      });
      expect(raw.reason).to.equal("Just because!");
    });
  });

  describe('#buffer', function () {
    it('should not be assignable', function () {
      const raw = RawResource.from(Buffer.from("file content"));
      //@ts-expect-error The whole point is that it's an error
      expect(() => raw.buffer = Buffer.from("hi")).to.throw();
    });

    it('should return the original buffer', function () {
      const originalBuffer = Buffer.from("file content");
      const raw = RawResource.from(originalBuffer);
      expect(raw.buffer).to.equal(originalBuffer);
    });

    // TODO: does it cache the buffer? should it?
  });

  //#endregion Properties

  //#region Initialization

  describe("#constructor", () => {
    it("should use the provided buffer wrapper", () => {
      const raw = new RawResource(ZLIB_BUFFER_CACHE);
      expect(raw.getCompressedBuffer()).to.equal(ZLIB_BUFFER_CACHE);
    });

    it("should set defaultCompressionType if option provided", () => {
      const raw = new RawResource(UNCOMPRESSED_BUFFER_CACHE, {
        defaultCompressionType: CompressionType.InternalCompression
      });

      expect(raw.defaultCompressionType).to.equal(CompressionType.InternalCompression);
    });

    it("should use ZLIB if no defaultCompressionType provided", () => {
      const raw = new RawResource(UNCOMPRESSED_BUFFER_CACHE);
      expect(raw.defaultCompressionType).to.equal(CompressionType.ZLIB);
    });

    it("should set owner if option provided", () => {
      const owner = new MockOwner();
      const raw = new RawResource(UNCOMPRESSED_BUFFER_CACHE, { owner });
      expect(raw.owner).to.equal(owner);
    });

    it("should have no owner if not provided", () => {
      const raw = new RawResource(UNCOMPRESSED_BUFFER_CACHE);
      expect(raw.owner).to.be.undefined;
    });

    it("should set reason if option provided", () => {
      const raw = new RawResource(UNCOMPRESSED_BUFFER_CACHE, {
        reason: "Because!"
      });

      expect(raw.reason).to.equal("Because!");
    });

    it("should have no reason if not provided", () => {
      const raw = new RawResource(UNCOMPRESSED_BUFFER_CACHE);
      expect(raw.reason).to.be.undefined;
    });
  });

  describe("#from()", function () {
    it("should create a new raw resource from the given buffer", () => {
      const buffer = Buffer.from("hello world");
      const raw = RawResource.from(buffer);
      expect(raw.buffer.toString()).to.equal("hello world");
    });

    it("should have cache after creation", () => {
      const buffer = Buffer.from("hello world");
      const raw = RawResource.from(buffer);
      expect(raw.hasBufferCache).to.be.true;
    });

    it("should create a wrapper for the provided buffer", () => {
      const buffer = Buffer.from("hello world");
      const raw = RawResource.from(buffer);
      const wrapper = raw.getCompressedBuffer(CompressionType.Uncompressed);
      expect(wrapper.buffer).to.equal(buffer);
      expect(wrapper.compressionType).to.equal(CompressionType.Uncompressed);
      expect(wrapper.sizeDecompressed).to.equal(11);
    });

    it("should set defaultCompressionType if option provided", () => {
      const raw = RawResource.from(Buffer.from("hi"), {
        defaultCompressionType: CompressionType.InternalCompression
      });

      expect(raw.defaultCompressionType).to.equal(CompressionType.InternalCompression);
    });

    it("should use ZLIB if defaultCompressionType not provided", () => {
      const raw = RawResource.from(Buffer.from("hi"));
      expect(raw.defaultCompressionType).to.equal(CompressionType.ZLIB);
    });

    it("should set owner if option provided", () => {
      const owner = new MockOwner();
      const raw = RawResource.from(Buffer.from("hi"), { owner });
      expect(raw.owner).to.equal(owner);
    });

    it("should not have owner if not provided", () => {
      const raw = RawResource.from(Buffer.from("hi"));
      expect(raw.owner).to.be.undefined;
    });

    it("should set reason if option provided", () => {
      const raw = RawResource.from(Buffer.from("hi"), {
        reason: "Because"
      });

      expect(raw.reason).to.equal("Because");
    });

    it("should not have reason if not provided", () => {
      const raw = RawResource.from(Buffer.from("hi"));
      expect(raw.reason).to.be.undefined;
    });
  });

  describe("#fromAsync()", () => {
    it("should return same as from()", async () => {
      const buffer = Buffer.from("hello world");
      const raw = await RawResource.fromAsync(buffer);
      expect(raw.buffer.toString()).to.equal("hello world");
    });
  });

  //#endregion Initialization

  //#region Methods

  describe("#clone()", function () {
    it("should copy the buffer", () => {
      const raw = RawResource.from(Buffer.from("file content"));
      const clone = raw.clone();
      expect(clone.buffer).to.equal(raw.buffer);
    });

    it("should copy defaultCompressionType", () => {
      const raw = RawResource.from(Buffer.from("file content"), {
        defaultCompressionType: CompressionType.InternalCompression
      });

      const clone = raw.clone();
      expect(clone.defaultCompressionType).to.equal(CompressionType.InternalCompression);
    });

    it("should copy the reason", () => {
      const raw = RawResource.from(Buffer.from("file content"), {
        reason: "because"
      });

      const clone = raw.clone();
      expect(clone.reason).to.equal("because");
    });
  });

  describe("#equals()", () => {
    it("should return true if the buffers are the same", () => {
      const raw = new RawResource(UNCOMPRESSED_BUFFER_CACHE);
      const clone = raw.clone();
      expect(raw.buffer).to.equal(clone.buffer);
      expect(raw.equals(clone)).to.be.true;
    });

    it("should return true if the buffers are different, but have the same content", () => {
      const raw = RawResource.from(Buffer.from("hi"));
      const other = RawResource.from(Buffer.from("hi"));
      expect(raw.buffer).to.not.equal(other.buffer);
      expect(raw.equals(other)).to.be.true;
    });

    it("should return true if the buffers are the same but the reason is different", () => {
      const raw = new RawResource(UNCOMPRESSED_BUFFER_CACHE);
      const other = new RawResource(UNCOMPRESSED_BUFFER_CACHE, {
        reason: "something"
      });
      expect(raw.buffer).to.equal(other.buffer);
      expect(raw.equals(other)).to.be.true;
    });

    it("should return false if the buffers have different content", () => {
      const raw = RawResource.from(Buffer.from("hi"));
      const other = RawResource.from(Buffer.from("bye"));
      expect(raw.equals(other)).to.be.false;
    });

    it("should return true when the buffers are the same, but in different compression formats", () => {
      const uncompressed = new RawResource(UNCOMPRESSED_BUFFER_CACHE);
      const compressed = new RawResource(ZLIB_BUFFER_CACHE);
      expect(UNCOMPRESSED_BUFFER_CACHE.buffer.compare(ZLIB_BUFFER_CACHE.buffer)).to.not.equal(0);
      expect(uncompressed.equals(compressed)).to.be.true;
    });

    it("should return false if other is not provided", () => {
      const raw = new RawResource(UNCOMPRESSED_BUFFER_CACHE);
      expect(raw.equals(null)).to.be.false;
    });
  });

  describe("#isXml()", () => {
    it("should return true if the buffer contains XML", () => {
      const raw = RawResource.from(Buffer.from(`<?xml version="1.0" encoding="utf-8"?>\n<I c="GameObject" i="object" m="objects.game_object" n="frankk_LB:objectTuning_textbook_Tartosiano" s="10565256321594783463"/>`));
      expect(raw.isXml()).to.be.true;
    });

    it("should return false if the buffer does not contain XML", () => {
      const raw = RawResource.from(Buffer.from(`something`));
      expect(raw.isXml()).to.be.false;
    });

    it("should return true when the buffer is compressed, but contains XML when uncompressed", () => {
      const xmlBuffer = Buffer.from(`<?xml version="1.0" encoding="utf-8"?>\n<I c="GameObject" i="object" m="objects.game_object" n="frankk_LB:objectTuning_textbook_Tartosiano" s="10565256321594783463"/>`);

      const raw = new RawResource({
        buffer: compressBuffer(xmlBuffer, CompressionType.ZLIB),
        compressionType: CompressionType.ZLIB,
        sizeDecompressed: xmlBuffer.byteLength
      });

      expect(raw.isXml()).to.be.true;
    });
  });

  describe("#onChange()", () => {
    it("should not affect the content", () => {
      const raw = RawResource.from(Buffer.from("file content"));
      expect(raw.buffer.toString()).to.equal("file content");
      raw.onChange();
      expect(raw.buffer.toString()).to.equal("file content");
    });

    it("should not uncache the buffer", () => {
      const raw = RawResource.from(Buffer.from("file content"));
      expect(raw.hasBufferCache).to.be.true;
      raw.onChange();
      expect(raw.hasBufferCache).to.be.true;
    });
  });

  //#endregion Methods
});
