import fs from "fs";
import path from "path";
import { expect } from "chai";
import { compressBuffer, CompressedBuffer, CompressionType } from "@s4tk/compression";
import { DdsImage } from "@s4tk/images";
import { EncodingType } from "../../../../dst/enums";
import { DdsImageResource } from '../../../../dst/models';
import MockOwner from "../../../mocks/mock-owner";

describe("DdsImageResource", () => {
  const imageSrcDir = path.resolve(__dirname, "..", "..", "..", "data", "images");

  const dstBuffer = fs.readFileSync(path.join(imageSrcDir, "LB-DST.dds"));
  const dxtBuffer = fs.readFileSync(path.join(imageSrcDir, "LB-DXT.dds"));
  const pngBuffer = fs.readFileSync(path.join(imageSrcDir, "LB.png"));

  const DST_BUFFER_CACHE: CompressedBuffer = {
    buffer: dstBuffer,
    compressionType: CompressionType.Uncompressed,
    sizeDecompressed: dstBuffer.byteLength
  };

  const DXT_BUFFER_CACHE: CompressedBuffer = {
    buffer: dxtBuffer,
    compressionType: CompressionType.Uncompressed,
    sizeDecompressed: dxtBuffer.byteLength
  };

  const ZLIB_DST_BUFFER_CACHE: CompressedBuffer = {
    buffer: compressBuffer(dstBuffer, CompressionType.ZLIB),
    compressionType: CompressionType.ZLIB,
    sizeDecompressed: dstBuffer.byteLength
  };

  //#region Properties

  describe("#encodingType", () => {
    it("should be \"DDS\" when loaded", () => {
      const dds = DdsImageResource.from(dxtBuffer);
      expect(dds.encodingType).to.equal(EncodingType.DDS);
    });
  });

  describe("#buffer", () => {
    it("should not be assignable", () => {
      const dds = DdsImageResource.from(dxtBuffer);
      //@ts-expect-error The whole point is that it's an error
      expect(() => dds.buffer = Buffer.from("hi")).to.throw();
    });

    it("should return the original buffer if uncompressed", () => {
      const dds = DdsImageResource.from(dxtBuffer);
      expect(dds.buffer).to.equal(dxtBuffer);
    });

    it("should decompress the buffer if compressed", () => {
      const dds = new DdsImageResource(ZLIB_DST_BUFFER_CACHE);
      expect(dds.buffer.compare(DST_BUFFER_CACHE.buffer)).to.equal(0);
    });

    it("should not cache the decompressed buffer if compressed", () => {
      const dds = new DdsImageResource(ZLIB_DST_BUFFER_CACHE);
      const firstBuffer = dds.buffer;
      const secondBuffer = dds.buffer;
      expect(firstBuffer).to.not.equal(secondBuffer);
    });
  });

  describe("#image", () => {
    it("should cache the image that is returned", () => {
      const dds = new DdsImageResource(DST_BUFFER_CACHE);
      const image = dds.image;
      expect(dds.image).to.equal(image);
    });

    it("should be shuffled if image is a DST", () => {
      const dds = new DdsImageResource(DST_BUFFER_CACHE);
      expect(dds.image.isShuffled).to.be.true;
    });

    it("should be unshuffled if image is a DXT", () => {
      const dds = new DdsImageResource(DXT_BUFFER_CACHE);
      expect(dds.image.isShuffled).to.be.false;
    });

    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const dds = new DdsImageResource(DST_BUFFER_CACHE, { owner });
      expect(owner.cached).to.be.true;
      dds.image = DdsImage.from(dxtBuffer);
      expect(owner.cached).to.be.false;
    });

    it("should reset the buffer cache when set", () => {
      const dds = new DdsImageResource(DST_BUFFER_CACHE);
      expect(dds.bufferCache).to.equal(DST_BUFFER_CACHE);
      dds.image = DdsImage.from(dxtBuffer);
      expect(dds.bufferCache).to.not.be.undefined;
      expect(dds.bufferCache).to.not.equal(DST_BUFFER_CACHE);
    });
  });

  //#endregion Properties

  //#region Initialization

  describe("#constructor", () => {
    // TODO:
  });

  describe("#from()", () => {
    // TODO:
  });

  describe("#fromAsync()", () => {
    // TODO:
  });

  describe("#fromDdsImage()", () => {
    // TODO:
  });

  describe("#fromDdsImageAsync()", () => {
    // TODO:
  });

  //#endregion Initialization

  //#region Methods

  describe("#clone()", () => {
    it("should copy the buffer", () => {
      const dds = DdsImageResource.from(dstBuffer);
      const clone = dds.clone();
      expect(clone.buffer).to.equal(dds.buffer);
    });

    it("should copy defaultCompressionType", () => {
      const dds = DdsImageResource.from(dstBuffer, {
        defaultCompressionType: CompressionType.InternalCompression
      });

      const clone = dds.clone();
      expect(clone.defaultCompressionType).to.equal(CompressionType.InternalCompression);
    });

    it("should copy the image cache if it's not undefined", () => {
      const dds = DdsImageResource.from(dstBuffer);
      dds.image;
      const clone = dds.clone();
      expect(clone.image).to.equal(dds.image);
    });
  });

  describe("#equals()", () => {
    it("should return true if the buffers are the same", () => {
      const dds = DdsImageResource.from(dstBuffer);
      const clone = dds.clone();
      expect(dds.buffer).to.equal(clone.buffer);
      expect(dds.equals(clone)).to.be.true;
    });

    it("should return true if the buffers are different, but have the same content", () => {
      const dds1 = DdsImageResource.from(dstBuffer);
      const dds2 = DdsImageResource.from(Buffer.from(dstBuffer));
      expect(dds1.buffer).to.not.equal(dds2.buffer);
      expect(dds1.equals(dds2)).to.be.true;
    });

    it("should return false if the buffers have different content", () => {
      const dst = DdsImageResource.from(dstBuffer);
      const dxt = DdsImageResource.from(dxtBuffer);
      expect(dst.equals(dxt)).to.be.false;
    });

    it("should return true when the buffers are the same, but in different compression formats", () => {
      const uncompressed = new DdsImageResource(DST_BUFFER_CACHE);
      const compressed = new DdsImageResource(ZLIB_DST_BUFFER_CACHE);
      expect(DST_BUFFER_CACHE.buffer.compare(ZLIB_DST_BUFFER_CACHE.buffer)).to.not.equal(0);
      expect(uncompressed.equals(compressed)).to.be.true;
    });

    it("should return false if other is not provided", () => {
      const dds = new DdsImageResource(DST_BUFFER_CACHE);
      //@ts-ignore Sometimes complains about being null
      expect(dds.equals(null)).to.be.false;
    });
  });

  describe("#isXml()", () => {
    it("should return false", () => {
      const dds = DdsImageResource.from(dxtBuffer);
      expect(dds.isXml()).to.be.false;
    });
  });

  describe("#onChange()", () => {
    it("should not affect the content", () => {
      const dds = DdsImageResource.from(dstBuffer);
      dds.onChange();
      expect(dds.buffer).to.equal(dstBuffer);
    });

    it("should not uncache the buffer", () => {
      const dds = DdsImageResource.from(dstBuffer);
      expect(dds.hasBufferCache).to.be.true;
      dds.onChange();
      expect(dds.hasBufferCache).to.be.true;
    });
  });

  describe("#replaceContent()", () => {
    it("should update the buffer cache", () => {
      const owner = new MockOwner();
      const dds = new DdsImageResource(DST_BUFFER_CACHE, { owner });
      expect(dds.bufferCache).to.equal(DST_BUFFER_CACHE);
      dds.replaceContent(ZLIB_DST_BUFFER_CACHE);
      expect(dds.bufferCache).to.equal(ZLIB_DST_BUFFER_CACHE);
    });

    it("should uncache the owner", () => {
      const owner = new MockOwner();
      const dds = new DdsImageResource(DST_BUFFER_CACHE, { owner });
      expect(owner.cached).to.be.true;
      dds.replaceContent(ZLIB_DST_BUFFER_CACHE);
      expect(owner.cached).to.be.false;
    });
  });

  //#endregion Methods
});
