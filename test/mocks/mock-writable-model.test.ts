import { expect } from "chai";
import { compressBuffer, CompressedBuffer, CompressionType } from "@s4tk/compression";
import MockWritableModel from "./mock-writable-model";
import MockOwner from "./mock-owner";

describe("MockWritableModel", () => {
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

  describe("#defaultCompressionType", () => {
    it("should change the value when set", () => {
      const model = new MockWritableModel();
      expect(model.defaultCompressionType).to.equal(CompressionType.ZLIB);
      model.defaultCompressionType = CompressionType.InternalCompression;
      expect(model.defaultCompressionType).to.equal(CompressionType.InternalCompression);
    });
  });

  describe("#hasBufferCache", () => {
    it("should be true when there is a buffer cached", () => {
      const model = new MockWritableModel("hi", {
        initialBufferCache: UNCOMPRESSED_BUFFER_CACHE
      });

      expect(model.hasBufferCache).to.be.true;
    });

    it("should be true when there wasn't a buffer cached, but one was generated", () => {
      const model = new MockWritableModel("hi");
      expect(model.hasBufferCache).to.be.false;
      model.getBuffer(true);
      expect(model.hasBufferCache).to.be.true;
    });

    it("should be false when there is no buffer cached", () => {
      const model = new MockWritableModel("hi");
      expect(model.hasBufferCache).to.be.false;
    });

    it("should be false when there was a buffer cached, but it was deleted", () => {
      const model = new MockWritableModel("hi", {
        initialBufferCache: UNCOMPRESSED_BUFFER_CACHE
      });

      expect(model.hasBufferCache).to.be.true;
      model.onChange();
      expect(model.hasBufferCache).to.be.false;
    });

    it("should be false when there was a buffer cached, but a watched property was changed", () => {
      const model = new MockWritableModel("hi", {
        initialBufferCache: UNCOMPRESSED_BUFFER_CACHE
      });

      expect(model.hasBufferCache).to.be.true;
      model.content = "hello";
      expect(model.hasBufferCache).to.be.false;
    });
  });

  //#endregion Properties

  //#region Initialization

  describe("#constructor", () => {
    it("should have an undefined owner if one was not provided", () => {
      const model = new MockWritableModel();
      expect(model.owner).to.be.undefined;
    });

    it("should use the owner that was provided", () => {
      const owner = new MockOwner();
      const model = new MockWritableModel("", { owner });
      expect(model.owner).to.equal(owner);
    });

    it("should set defaultCompressionType to ZLIB if not provided", () => {
      const model = new MockWritableModel();
      expect(model.defaultCompressionType).to.equal(CompressionType.ZLIB);
    });

    it("should use the defaultCompressionType that was provided", () => {
      const model = new MockWritableModel("", {
        defaultCompressionType: CompressionType.Uncompressed
      });

      expect(model.defaultCompressionType).to.equal(CompressionType.Uncompressed);
    });

    it("should not have a cache if initialBufferCache was not provided", () => {
      const model = new MockWritableModel();
      expect(model.hasBufferCache).to.be.false;
    });

    it("should use the initialBufferCache that was provided", () => {
      const model = new MockWritableModel("hi", {
        initialBufferCache: UNCOMPRESSED_BUFFER_CACHE
      });

      expect(model.hasBufferCache).to.be.true;
    });
  });

  //#endregion Initialization

  //#region Methods

  describe("#getBuffer()", () => {
    context("cache = true", () => {
      context("has compressed cache", () => {
        it("should decompress the cache and return the result", () => {
          const mock = new MockWritableModel("hi", {
            initialBufferCache: ZLIB_BUFFER_CACHE
          });

          const buffer = mock.getBuffer(true);
          expect(buffer.toString()).to.equal("hi");
          expect(buffer).to.not.equal(ZLIB_BUFFER_CACHE.buffer);
        });

        it("should overwrite the existing cache", () => {
          const mock = new MockWritableModel("hi", {
            initialBufferCache: ZLIB_BUFFER_CACHE
          });

          expect(mock.bufferCache).to.equal(ZLIB_BUFFER_CACHE);
          const buffer = mock.getBuffer(true);
          expect(mock.bufferCache).to.not.equal(ZLIB_BUFFER_CACHE);
          expect(mock.bufferCache.buffer).to.equal(buffer);
          expect(mock.bufferCache.compressionType).to.equal(CompressionType.Uncompressed);
        });
      });

      context("has uncompressed cache", () => {
        it("should return the cached buffer", () => {
          const mock = new MockWritableModel("hi", {
            initialBufferCache: UNCOMPRESSED_BUFFER_CACHE
          });

          const buffer = mock.getBuffer(true);
          expect(buffer.toString()).to.equal("hi");
          expect(buffer).to.equal(UNCOMPRESSED_BUFFER_CACHE.buffer);
        });

        it("should not replace the cache", () => {
          const mock = new MockWritableModel("hi", {
            initialBufferCache: UNCOMPRESSED_BUFFER_CACHE
          });

          expect(mock.bufferCache).to.equal(UNCOMPRESSED_BUFFER_CACHE);
          mock.getBuffer(true);
          expect(mock.bufferCache).to.equal(UNCOMPRESSED_BUFFER_CACHE);
        });
      });

      context("does not have cache", () => {
        it("should serialize the model and return an uncompressed buffer", () => {
          const mock = new MockWritableModel("hi");
          const buffer = mock.getBuffer(true);
          expect(buffer.toString()).to.equal("hi");
        });

        it("should set the cache", () => {
          const mock = new MockWritableModel("hi");
          expect(mock.hasBufferCache).to.be.false;
          mock.getBuffer(true);
          expect(mock.hasBufferCache).to.be.true;
        });
      });
    });

    context("cache = false", () => {
      context("has compressed cache", () => {
        it("should decompress the cache and return the result", () => {
          const mock = new MockWritableModel("hi", {
            initialBufferCache: ZLIB_BUFFER_CACHE
          });

          const buffer = mock.getBuffer();
          expect(buffer.toString()).to.equal("hi");
          expect(buffer).to.not.equal(ZLIB_BUFFER_CACHE.buffer);
        });

        it("should not overwrite the existing cache", () => {
          const mock = new MockWritableModel("hi", {
            initialBufferCache: ZLIB_BUFFER_CACHE
          });

          expect(mock.bufferCache).to.equal(ZLIB_BUFFER_CACHE);
          mock.getBuffer();
          expect(mock.bufferCache).to.equal(ZLIB_BUFFER_CACHE);
        });
      });

      context("has uncompressed cache", () => {
        it("should return the cached buffer", () => {
          const mock = new MockWritableModel("hi", {
            initialBufferCache: UNCOMPRESSED_BUFFER_CACHE
          });

          const buffer = mock.getBuffer();
          expect(buffer.toString()).to.equal("hi");
          expect(buffer).to.equal(UNCOMPRESSED_BUFFER_CACHE.buffer);
        });

        it("should not delete the cache", () => {
          const mock = new MockWritableModel("hi", {
            initialBufferCache: UNCOMPRESSED_BUFFER_CACHE
          });

          expect(mock.bufferCache).to.equal(UNCOMPRESSED_BUFFER_CACHE);
          mock.getBuffer();
          expect(mock.bufferCache).to.equal(UNCOMPRESSED_BUFFER_CACHE);
        });
      });

      context("does not have cache", () => {
        it("should serialize the model and return an uncompressed buffer", () => {
          const mock = new MockWritableModel("hi");
          const buffer = mock.getBuffer();
          expect(buffer.toString()).to.equal("hi");
        });

        it("should not set the cache", () => {
          const mock = new MockWritableModel("hi");
          expect(mock.hasBufferCache).to.be.false;
          mock.getBuffer();
          expect(mock.hasBufferCache).to.be.false;
        });
      });
    });
  });

  describe("#getBufferAsync()", () => {
    it("should return the same result as getBuffer()", async () => {
      const mock = new MockWritableModel("hi");
      const buffer = await mock.getBufferAsync();
      expect(buffer.toString()).to.equal("hi");
    });
  });

  describe("#getCompressedBuffer()", () => {
    it("should use the model's default compression if not supplied (ZLIB)", () => {
      const mock = new MockWritableModel("hi", {
        defaultCompressionType: CompressionType.ZLIB
      });
      const wrapper = mock.getCompressedBuffer();
      expect(wrapper.compressionType).to.equal(CompressionType.ZLIB);
      expect(wrapper.buffer.compare(ZLIB_BUFFER_CACHE.buffer)).to.equal(0);
    });

    it("should use the model's default compression if not supplied (Uncompressed)", () => {
      const mock = new MockWritableModel("hi", {
        defaultCompressionType: CompressionType.Uncompressed
      });
      const wrapper = mock.getCompressedBuffer();
      expect(wrapper.compressionType).to.equal(CompressionType.Uncompressed);
      expect(wrapper.buffer.toString()).to.equal("hi");
    });

    context("cache = true", () => {
      context("has correctly compressed cache", () => {
        it("should return the cached buffer", () => {
          const mock = new MockWritableModel("hi", {
            initialBufferCache: ZLIB_BUFFER_CACHE
          });

          const wrapper = mock.getCompressedBuffer(CompressionType.ZLIB, true);
          expect(wrapper).to.equal(ZLIB_BUFFER_CACHE);
        });

        it("should not replace the cache", () => {
          const mock = new MockWritableModel("hi", {
            initialBufferCache: ZLIB_BUFFER_CACHE
          });

          mock.getCompressedBuffer(CompressionType.ZLIB, true);
          expect(mock.bufferCache).to.equal(ZLIB_BUFFER_CACHE);
        });
      });

      context("has other cache", () => {
        it("should compress/convert the cache and return the result", () => {
          const mock = new MockWritableModel("hi", {
            initialBufferCache: UNCOMPRESSED_BUFFER_CACHE
          });

          const wrapper = mock.getCompressedBuffer(CompressionType.ZLIB, true);
          expect(wrapper.buffer.compare(ZLIB_BUFFER_CACHE.buffer)).to.equal(0);
          expect(wrapper.compressionType).to.equal(CompressionType.ZLIB);
        });

        it("should overwrite the existing cache", () => {
          const mock = new MockWritableModel("hi", {
            initialBufferCache: UNCOMPRESSED_BUFFER_CACHE
          });

          mock.getCompressedBuffer(CompressionType.ZLIB, true);
          expect(mock.bufferCache).to.not.equal(UNCOMPRESSED_BUFFER_CACHE);
          expect(mock.bufferCache.compressionType).to.equal(CompressionType.ZLIB);
          expect(mock.bufferCache.buffer.compare(ZLIB_BUFFER_CACHE.buffer)).to.equal(0);
        });
      });

      context("does not have cache", () => {
        it("should serialize the model and return a compressed buffer", () => {
          const mock = new MockWritableModel("hi");
          const wrapper = mock.getCompressedBuffer(CompressionType.ZLIB, true);
          expect(wrapper.compressionType).to.equal(CompressionType.ZLIB);
          expect(wrapper.buffer.compare(ZLIB_BUFFER_CACHE.buffer)).to.equal(0);
        });

        it("should set the cache", () => {
          const mock = new MockWritableModel("hi");
          expect(mock.hasBufferCache).to.be.false;
          const wrapper = mock.getCompressedBuffer(CompressionType.ZLIB, true);
          expect(mock.hasBufferCache).to.be.true;
          expect(wrapper).to.equal(mock.bufferCache);
        });
      });
    });

    context("cache = false", () => {
      context("has correctly compressed cache", () => {
        it("should return the cached buffer", () => {
          const mock = new MockWritableModel("hi", {
            initialBufferCache: ZLIB_BUFFER_CACHE
          });

          const wrapper = mock.getCompressedBuffer(CompressionType.ZLIB);
          expect(wrapper).to.equal(ZLIB_BUFFER_CACHE);
        });

        it("should not delete the cache", () => {
          const mock = new MockWritableModel("hi", {
            initialBufferCache: ZLIB_BUFFER_CACHE
          });

          mock.getCompressedBuffer(CompressionType.ZLIB);
          expect(mock.bufferCache).to.equal(ZLIB_BUFFER_CACHE);
        });
      });

      context("has other cache", () => {
        it("should compress/convert the cache and return the result", () => {
          const mock = new MockWritableModel("hi", {
            initialBufferCache: UNCOMPRESSED_BUFFER_CACHE
          });

          const wrapper = mock.getCompressedBuffer(CompressionType.ZLIB);
          expect(wrapper.buffer.compare(ZLIB_BUFFER_CACHE.buffer)).to.equal(0);
          expect(wrapper.compressionType).to.equal(CompressionType.ZLIB);
        });

        it("should not overwrite the existing cache", () => {
          const mock = new MockWritableModel("hi", {
            initialBufferCache: UNCOMPRESSED_BUFFER_CACHE
          });

          mock.getCompressedBuffer(CompressionType.ZLIB);
          expect(mock.bufferCache).to.equal(UNCOMPRESSED_BUFFER_CACHE);
        });
      });

      context("does not have cache", () => {
        it("should serialize the model and return a compressed buffer", () => {
          const mock = new MockWritableModel("hi");
          const wrapper = mock.getCompressedBuffer(CompressionType.ZLIB);
          expect(wrapper.compressionType).to.equal(CompressionType.ZLIB);
          expect(wrapper.buffer.compare(ZLIB_BUFFER_CACHE.buffer)).to.equal(0);
        });

        it("should not set the cache", () => {
          const mock = new MockWritableModel("hi");
          expect(mock.hasBufferCache).to.be.false;
          const wrapper = mock.getCompressedBuffer(CompressionType.ZLIB);
          expect(mock.hasBufferCache).to.be.false;
          expect(wrapper).to.not.equal(mock.bufferCache);
        });
      });
    });
  });

  describe("#getCompressedBufferAsync()", () => {
    it("should return the same result as getCompressedBuffer()", async () => {
      const mock = new MockWritableModel("hi");
      const wrapper = await mock.getCompressedBufferAsync();
      expect(wrapper.compressionType).to.equal(CompressionType.ZLIB);
      expect(wrapper.buffer.compare(ZLIB_BUFFER_CACHE.buffer)).to.equal(0);
    });
  });

  describe("#onChange()", () => {
    it("should clear the cache", () => {
      const model = new MockWritableModel("hi");
      model.getBuffer(true);
      expect(model.hasBufferCache).to.be.true;
      model.onChange();
      expect(model.hasBufferCache).to.be.false;
    });

    it("should clear the owner's cache", () => {
      const owner = new MockOwner();
      const model = new MockWritableModel("hi", { owner });
      expect(owner.cached).to.be.true;
      model.onChange();
      expect(owner.cached).to.be.false;
    });
  });

  //#endregion Methods
});
