import fs from "fs";
import path from "path";
import { expect } from "chai";
import { DeletedResource, Package } from "../../../../dst/models";
import EncodingType from "../../../../dst/lib/enums/encoding-type";
import { CompressionType } from "@s4tk/compression";

describe("DeletedResource", () => {
  //#region Properties

  describe("#encodingType", () => {
    it("should be EncodingType.Null", () => {
      const del = new DeletedResource();
      expect(del.encodingType).to.equal(EncodingType.Null);
    });
  });

  describe("#buffer", () => {
    it("should be empty", () => {
      const del = new DeletedResource();
      expect(del.buffer.byteLength).to.equal(0);
    });
  });

  describe("#bufferCache", () => {
    it("should always be the same", () => {
      const del1 = new DeletedResource();
      const del2 = new DeletedResource();
      expect(del1).to.not.equal(del2);
      expect(del1.bufferCache).to.equal(del2.bufferCache);
    });
  });

  describe("#defaultCompressionType", () => {
    it("should always be DeletedRecord", () => {
      const del = new DeletedResource();
      expect(del.defaultCompressionType).to.equal(CompressionType.DeletedRecord);
    });
  });

  //#endregion Properties

  //#region Initialization

  describe("#constructor", () => {
    it("should use the same cache for each instance", () => {
      const del1 = new DeletedResource();
      const del2 = new DeletedResource();
      expect(del1.bufferCache).to.equal(del2.bufferCache);
    });
  });

  //#endregion Initialization

  //#region Methods

  describe("#isXml", () => {
    it("should be false", () => {
      const del = new DeletedResource();
      expect(del.isXml()).to.be.false;
    });
  });

  //#endregion Methods
});
