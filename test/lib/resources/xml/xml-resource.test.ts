import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import { XmlDocumentNode, XmlElementNode, XmlValueNode } from "@s4tk/xml-dom";
import { CompressedBuffer, CompressionType } from "@s4tk/compression";
import { XmlResource } from '../../../../dst/models';
import { EncodingType } from "../../../../dst/enums";
import MockOwner from "../../../mocks/mock-owner";

//#region Helpers & Constants

const XML_DECLARATION = '<?xml version="1.0" encoding="utf-8"?>';

const _cachedBuffers: { [key: string]: Buffer; } = {};

function getBuffer(filename: string): Buffer {
  if (!_cachedBuffers[filename]) {
    const filepath = path.resolve(__dirname, `../../../data/tuning/${filename}.xml`);
    _cachedBuffers[filename] = fs.readFileSync(filepath);
  }

  return _cachedBuffers[filename];
}

//#endregion Helpers & Constants

describe('XmlResource', function () {
  //#region Properties

  describe('#encodingType', function () {
    it('should be "XML"', function () {
      const tun = XmlResource.from(Buffer.from("file content"));
      expect(tun.encodingType).to.equal(EncodingType.XML);
    });
  });

  describe('#content', function () {
    context('getting', function () {
      it("should return an empty string for an empty resource", function () {
        const tun = new XmlResource();
        expect(tun.content).to.equal('');
      });

      it("should return the content for tuning created from a buffer", function () {
        const buffer = Buffer.from(`<I n="some_file"></I>`);
        const tun = XmlResource.from(buffer);
        expect(tun.content).to.equal(`<I n="some_file"></I>`);
      });

      it("should return the content for tuning created from a string", function () {
        const tun = new XmlResource(`<I n="some_file"></I>`);
        expect(tun.content).to.equal(`<I n="some_file"></I>`);
      });

      it("should return the content for tuning created from a DOM", function () {
        const dom = XmlDocumentNode.from(`<I n="some_file"></I>`);
        const tun = new XmlResource(null, dom);
        expect(tun.content).to.equal(`${XML_DECLARATION}\n<I n="some_file"/>`)
      });
    });

    context('setting', function () {
      it("should update the content", function () {
        const tun = new XmlResource();
        expect(tun.content).to.equal("");
        tun.content = "<I/>";
        expect(tun.content).to.equal("<I/>");
      });

      it("should uncache the buffer", function () {
        const buffer = Buffer.from("hi");
        const tun = XmlResource.from(buffer, { saveBuffer: true });
        expect(tun.hasBufferCache).to.be.true;
        tun.content = "hello";
        expect(tun.hasBufferCache).to.be.false;
      });

      it("should reset the DOM", function () {
        const tun = new XmlResource("<T>50</T>");
        expect(tun.dom.child.innerValue).to.equal("50");
        tun.content = "<T>25</T>";
        expect(tun.dom.child.innerValue).to.equal("25");
      });
    });
  });

  describe('#dom', function () {
    context('getting', function () {
      it("should return an empty DOM for an empty resource", function () {
        const tun = new XmlResource();
        expect(tun.dom.numChildren).to.equal(0);
      });

      it("should return the DOM for tuning created from a buffer", function () {
        const tun = XmlResource.from(Buffer.from("<T>50</T>"));
        expect(tun.dom.child.tag).to.equal("T");
        expect(tun.dom.child.innerValue).to.equal("50");
      });

      it("should return the DOM for tuning created from a string", function () {
        const tun = new XmlResource("<T>50</T>");
        expect(tun.dom.child.tag).to.equal("T");
        expect(tun.dom.child.innerValue).to.equal("50");
      });

      it("should return the original DOM for tuning created from a DOM", function () {
        const dom = XmlDocumentNode.from("<T>50</T>");
        const tun = new XmlResource(null, dom);
        expect(tun.dom).to.equal(dom);
      });

      it("should not reset the content or uncache the buffer when mutated", function () {
        const tun = XmlResource.from(Buffer.from("<T>50</T>"), { saveBuffer: true });
        expect(tun.hasBufferCache).to.be.true;
        expect(tun.content).to.equal("<T>50</T>");
        tun.dom.child.innerValue = 25;
        expect(tun.hasBufferCache).to.be.true;
        expect(tun.content).to.equal("<T>50</T>");
      });
    });

    context('setting', function () {
      it("should update the DOM", function () {
        const dom = XmlDocumentNode.from("<T>50</T>");
        const tun = new XmlResource(null, dom);
        tun.dom = XmlDocumentNode.from("<T>25</T>");
        expect(tun.dom.child.innerValue).to.equal("25");
      });

      it("should uncache the buffer", function () {
        const tun = XmlResource.from(Buffer.from("<T>50</T>"), { saveBuffer: true });
        expect(tun.hasBufferCache).to.be.true;
        tun.dom = XmlDocumentNode.from("<T>25</T>");
        expect(tun.hasBufferCache).to.be.false;
      });

      it("should reset the content", function () {
        const tun = XmlResource.from(Buffer.from("<T>50</T>"));
        expect(tun.content).to.equal(`<T>50</T>`);
        tun.dom = XmlDocumentNode.from("<T>25</T>");
        expect(tun.content).to.equal(`${XML_DECLARATION}\n<T>25</T>`);
      });
    });
  });

  describe('#root', function () {
    context('getting', function () {
      it("should return undefined if the DOM has no children", function () {
        const tun = new XmlResource();
        expect(tun.root).to.be.undefined;
      });

      it("should return the child of the DOM if it's the only one", function () {
        const tun = new XmlResource("<T>Hi</T>");
        expect(tun.root.tag).to.equal("T");
        expect(tun.root.innerValue).to.equal("Hi");
      });

      it("should return the first child of the DOM if there are more than one", function () {
        const tun = new XmlResource("<T>Hi</T><L><U/></L>");
        expect(tun.root.tag).to.equal("T");
        expect(tun.root.innerValue).to.equal("Hi");
      });
    });

    context('setting', function () {
      it("should update the first child of the DOM", function () {
        const dom = XmlDocumentNode.from("<T>50</T>");
        const tun = new XmlResource(null, dom);
        tun.root = new XmlElementNode({
          tag: "E",
          children: [
            new XmlValueNode("VALUE")
          ]
        });
        expect(dom.child.tag).to.equal("E");
        expect(dom.child.innerValue).to.equal("VALUE");
      });

      it("should uncache the buffer", function () {
        const tun = XmlResource.from(Buffer.from("<T>50</T>"), { saveBuffer: true });
        expect(tun.hasBufferCache).to.be.true;
        tun.root = new XmlElementNode({
          tag: "E",
          children: [
            new XmlValueNode("VALUE")
          ]
        });
        expect(tun.hasBufferCache).to.be.false;
      });

      it("should reset the content", function () {
        const dom = XmlDocumentNode.from("<T>50</T>");
        const tun = new XmlResource(null, dom);
        expect(tun.content).to.equal(`${XML_DECLARATION}\n<T>50</T>`);
        tun.root = new XmlElementNode({
          tag: "E",
          children: [
            new XmlValueNode("VALUE")
          ]
        });
        expect(tun.content).to.equal(`${XML_DECLARATION}\n<E>VALUE</E>`);
      });
    });
  });

  //#endregion Properties

  //#region Initialization

  describe("#constructor", () => {
    it("should use the content that is given", () => {
      const tun = new XmlResource("stuff");
      expect(tun.content).to.equal("stuff");
    });

    it("should use the DOM that is given", () => {
      const dom = new XmlDocumentNode(new XmlElementNode({ tag: "I" }));
      const tun = new XmlResource(null, dom);
      expect(tun.dom).to.equal(dom);
    });

    it("should throw if both content and DOM are given", () => {
      const dom = new XmlDocumentNode(new XmlElementNode({ tag: "I" }));
      expect(() => new XmlResource("stuff", dom)).to.throw();
    });

    it("should use defaultCompressionType that is given", () => {
      // TODO:
    });

    it("should use defaultCompressionType of ZLIB if not given", () => {
      // TODO:
    });

    it("should use owner that is given", () => {
      // TODO:
    });

    it("should have undefined owner if not given", () => {
      // TODO:
    });

    it("should use initialBufferCache that is given", () => {
      // TODO:
    });

    it("should not be cached if initialBufferCache is not given", () => {
      // TODO:
    });
  });

  describe('#from()', function () {
    it("should create a tuning resource with the content of the given buffer", function () {
      const tun = XmlResource.from(Buffer.from("Hello"));
      expect(tun.content).to.equal("Hello");
    });

    it("should use the owner that is provided", () => {
      const owner = new MockOwner();
      const tun = XmlResource.from(Buffer.from("Hello"), { owner });
      expect(tun.owner).to.equal(owner);
    });

    it("should have an undefined owner if none is provided", () => {
      const tun = XmlResource.from(Buffer.from("Hello"));
      expect(tun.owner).to.be.undefined;
    });

    it("should have a defaultCompressionType of ZLIB if none is provided", () => {
      const tun = XmlResource.from(Buffer.from("Hello"));
      expect(tun.defaultCompressionType).to.equal(CompressionType.ZLIB);
    });

    it("should use the provided defaultCompressionType", () => {
      const tun = XmlResource.from(Buffer.from("Hello"), {
        defaultCompressionType: CompressionType.InternalCompression
      });

      expect(tun.defaultCompressionType).to.equal(CompressionType.InternalCompression);
    });

    it("should cache the initialBufferCache that is provided if saveBuffer is true", () => {
      const buffer = Buffer.from("Hello");

      const wrapper: CompressedBuffer = {
        buffer,
        sizeDecompressed: 5,
        compressionType: CompressionType.Uncompressed
      };

      const tun = XmlResource.from(buffer, {
        saveBuffer: true,
        initialBufferCache: wrapper
      });

      expect(tun.hasBufferCache).to.be.true;
      expect(tun.getCompressedBuffer(CompressionType.Uncompressed)).to.equal(wrapper);
    });

    it("should not cache the initialBufferCache that is provided if saveBuffer is false", () => {
      const buffer = Buffer.from("Hello");

      const wrapper: CompressedBuffer = {
        buffer,
        sizeDecompressed: 5,
        compressionType: CompressionType.Uncompressed
      };

      const tun = XmlResource.from(buffer, {
        initialBufferCache: wrapper
      });

      expect(tun.hasBufferCache).to.be.false;
    });

    it("should cache the given buffer if no initialBufferCache is provided and saveBuffer is true", function () {
      const buffer = Buffer.from("Hello");
      const tun = XmlResource.from(buffer, { saveBuffer: true });
      expect(tun.hasBufferCache).to.be.true;
      expect(tun.getBuffer()).to.equal(buffer);
    });

    it("should not cache the buffer if saveBuffer = false", function () {
      const tun = XmlResource.from(Buffer.from("Hello"), { saveBuffer: false });
      expect(tun.hasBufferCache).to.be.false;
    });

    it("should not cache the buffer by default", function () {
      const tun = XmlResource.from(Buffer.from("Hello"));
      expect(tun.hasBufferCache).to.be.false;
    });

    it('should be able to handle real files', function () {
      const buffer = getBuffer("ExampleTrait");
      const tun = XmlResource.from(buffer);

      // instance
      expect(tun.root.tag).to.equal("I");
      expect(tun.root.attributes.c).to.equal("Trait");
      expect(tun.root.attributes.i).to.equal("trait");
      expect(tun.root.attributes.m).to.equal("traits.trait");
      expect(tun.root.name).to.equal("trait_HotHeaded");
      expect(tun.root.id).to.equal("16845");

      // tunables
      expect(tun.root.numChildren).to.equal(17);
      expect(tun.root.children[0].tag).to.equal("L");
      expect(tun.root.children[0].name).to.equal("actor_mixers");
      expect(tun.root.children[6].tag).to.equal("T");
      expect(tun.root.children[6].name).to.equal("display_name");
      expect(tun.root.children[6].innerValue).to.equal("0x80A081AC");
      expect(tun.root.children[6].children[1].value).to.equal("Hot-Headed");
      expect(tun.root.children[16].tag).to.equal("V");
      expect(tun.root.children[16].name).to.equal("whim_set");

      // searching
      const buffReplacements = tun.root.children.find(child => child.name === "buff_replacements");
      expect(buffReplacements.numChildren).to.equal(3);
      expect(buffReplacements.child.tag).to.equal("U");
      expect(buffReplacements.child.child.tag).to.equal("T");
      expect(buffReplacements.child.child.name).to.equal("key");
      expect(buffReplacements.child.child.innerValue).to.equal("12827");
      expect(buffReplacements.child.children[1].child.name).to.equal("buff_type");
      expect(buffReplacements.child.children[1].child.innerValue).to.equal("27323");
    });
  });

  describe("#fromAsync()", () => {
    it("should return a resource in a promise", async () => {
      const tun = await XmlResource.fromAsync(getBuffer("ExampleTrait"));
      expect(tun).to.be.instanceOf(XmlResource);
      expect(tun.encodingType).to.equal(EncodingType.XML);
    });
  });

  //#endregion Initialization

  //#region Methods

  describe('#clone()', function () {
    it("should create a new resource with the same content and DOM", function () {
      const tun = new XmlResource("<T>50</T>");
      const clone = tun.clone();
      expect(clone.content).to.equal("<T>50</T>");
      expect(clone.root.tag).to.equal("T");
      expect(clone.root.innerValue).to.equal("50");
    });

    it("should not mutate the original's content", function () {
      const tun = new XmlResource("<T>50</T>");
      const clone = tun.clone();
      clone.content = "hello";
      expect(tun.content).to.equal("<T>50</T>");
      expect(clone.content).to.equal("hello");
    });

    it("should not mutate the original's DOM", function () {
      const dom = XmlDocumentNode.from("<T>50</T>")
      const tun = new XmlResource(null, dom);
      const clone = tun.clone();
      clone.root.innerValue = "25";
      expect(tun.root.innerValue).to.equal("50");
      expect(clone.root.innerValue).to.equal("25");
    });
  });

  describe("#equals()", () => {
    it("should return true if the contents are the same", () => {
      const tuning = new XmlResource("<I>something</I>");
      expect(tuning.equals(tuning.clone())).to.be.true;
    });

    it("should return false if the contents are different", () => {
      const tuning = new XmlResource("<I>something</I>");
      const other = new XmlResource("<I>something_else</I>");
      expect(tuning.equals(other)).to.be.false;
    });
  });

  describe("#isXml()", () => {
    it("should return true", () => {
      const tuning = new XmlResource();
      expect(tuning.isXml()).to.be.true;
    });
  });

  describe('#updateDom()', function () {
    it('should uncache the buffer', function () {
      const tun = XmlResource.from(Buffer.from("<T>50</T>"), { saveBuffer: true });
      expect(tun.hasBufferCache).to.be.true;
      tun.updateDom(dom => {
        dom.child.innerValue = 25;
      });
      expect(tun.hasBufferCache).to.be.false;
    });

    it('should update the DOM', function () {
      const tun = XmlResource.from(Buffer.from("<T>50</T>"));
      tun.updateDom(dom => {
        dom.child.innerValue = 25;
      });
      expect(tun.dom.child.innerValue).to.equal(25);
    });

    it('should reset the content', function () {
      const tun = XmlResource.from(Buffer.from("<T>50</T>"));
      tun.updateDom(dom => {
        dom.child.innerValue = 25;
      });
      expect(tun.content).to.equal(`${XML_DECLARATION}\n<T>25</T>`);
    });
  });

  describe('#updateRoot()', function () {
    it('should uncache the buffer', function () {
      const tun = XmlResource.from(Buffer.from("<T>50</T>"), { saveBuffer: true });
      expect(tun.hasBufferCache).to.be.true;
      tun.updateRoot(root => {
        root.innerValue = 25;
      });
      expect(tun.hasBufferCache).to.be.false;
    });

    it('should update the root', function () {
      const tun = XmlResource.from(Buffer.from("<T>50</T>"));
      tun.updateRoot(root => {
        root.innerValue = 25;
      });
      expect(tun.root.innerValue).to.equal(25);
    });

    it('should reset the content', function () {
      const tun = XmlResource.from(Buffer.from("<T>50</T>"));
      tun.updateRoot(root => {
        root.innerValue = 25;
      });
      expect(tun.content).to.equal(`${XML_DECLARATION}\n<T>25</T>`);
    });
  });

  describe('#onChange()', function () {
    it('should uncache the buffer', function () {
      const tun = XmlResource.from(Buffer.from("Hello"), { saveBuffer: true });
      expect(tun.hasBufferCache).to.be.true;
      tun.onChange();
      expect(tun.hasBufferCache).to.be.false;
    });
  });

  //#endregion Methods
});
