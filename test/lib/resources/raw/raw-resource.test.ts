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

  describe('#clone()', function () {
    it('should create another raw resource with the same content', function () {
      const raw = RawResource.from(Buffer.from("file content"));
      const clone = raw.clone();
      expect(clone.buffer.toString()).to.equal("file content");
    });
  });

  // TODO: equals()

  // TODO: isXml()

  describe('#onChange()', function () {
    it('should not affect the content', function () {
      const raw = RawResource.from(Buffer.from("file content"));
      expect(raw.buffer.toString()).to.equal("file content");
      raw.onChange();
      expect(raw.buffer.toString()).to.equal("file content");
    });

    it('should not uncache the buffer', function () {
      const raw = RawResource.from(Buffer.from("file content"));
      expect(raw.hasBufferCache).to.be.true;
      raw.onChange();
      expect(raw.hasBufferCache).to.be.true;
    });
  });

  //#endregion Methods
});
