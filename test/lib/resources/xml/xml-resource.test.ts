import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import { XmlDocumentNode, XmlElementNode, XmlValueNode } from "@s4tk/xml-dom";
import { XmlResource } from '../../../../dst/models';
import { EncodingType } from "../../../../dst/enums";

const XML_DECLARATION = '<?xml version="1.0" encoding="utf-8"?>';

//#region Helpers

const cachedBuffers: { [key: string]: Buffer; } = {};

function getBuffer(filename: string): Buffer {
  if (!cachedBuffers[filename]) {
    const filepath = path.resolve(__dirname, `../../../data/tuning/${filename}.xml`);
    cachedBuffers[filename] = fs.readFileSync(filepath);
  }

  return cachedBuffers[filename];
}

function getTuningFromFile(filename: string, saveBuffer = false): XmlResource {
  return XmlResource.from(getBuffer(filename), { saveBuffer });
}

//#endregion Helpers

describe('XmlResource', function() {
  //#region Properties

  describe('#encodingType', function() {
    it('should be "XML"', function() {
      const tun = XmlResource.from(Buffer.from("file content"));
      expect(tun.encodingType).to.equal(EncodingType.XML);
    });
  });

  describe('#content', function() {
    context('getting', function() {
      it("should return an empty string for an empty resource", function() {
        const tun = XmlResource.create();
        expect(tun.content).to.equal('');
      });

      it("should return the content for tuning created from a buffer", function() {
        const buffer = Buffer.from(`<I n="some_file"></I>`);
        const tun = XmlResource.from(buffer);
        expect(tun.content).to.equal(`<I n="some_file"></I>`);
      });

      it("should return the content for tuning created from a string", function() {
        const tun = XmlResource.create({ content: `<I n="some_file"></I>` });
        expect(tun.content).to.equal(`<I n="some_file"></I>`);
      });

      it("should return the content for tuning created from a DOM", function() {
        const dom = XmlDocumentNode.from(`<I n="some_file"></I>`);
        const tun = XmlResource.create({ dom });
        expect(tun.content).to.equal(`${XML_DECLARATION}\n<I n="some_file"/>`)
      });
    });

    context('setting', function() {
      it("should update the content", function() {
        const tun = XmlResource.create();
        expect(tun.content).to.equal("");
        tun.content = "<I/>";
        expect(tun.content).to.equal("<I/>");
      });

      it("should uncache the buffer", function() {
        const buffer = Buffer.from("hi");
        const tun = XmlResource.from(buffer, { saveBuffer: true });
        expect(tun.isCached).to.be.true;
        tun.content = "hello";
        expect(tun.isCached).to.be.false;
      });

      it("should reset the DOM", function() {
        const tun = XmlResource.create({ content: "<T>50</T>" });
        expect(tun.dom.child.innerValue).to.equal("50");
        tun.content = "<T>25</T>";
        expect(tun.dom.child.innerValue).to.equal("25");
      });
    });
  });

  describe('#dom', function() {
    context('getting', function() {
      it("should return an empty DOM for an empty resource", function() {
        const tun = XmlResource.create();
        expect(tun.dom.numChildren).to.equal(0);
      });

      it("should return the DOM for tuning created from a buffer", function() {
        const tun = XmlResource.from(Buffer.from("<T>50</T>"));
        expect(tun.dom.child.tag).to.equal("T");
        expect(tun.dom.child.innerValue).to.equal("50");
      });

      it("should return the DOM for tuning created from a string", function() {
        const tun = XmlResource.create({ content: "<T>50</T>" });
        expect(tun.dom.child.tag).to.equal("T");
        expect(tun.dom.child.innerValue).to.equal("50");
      });

      it("should return the original DOM for tuning created from a DOM", function() {
        const dom = XmlDocumentNode.from("<T>50</T>");
        const tun = XmlResource.create({ dom });
        expect(tun.dom).to.equal(dom);
      });

      it("should not reset the content or uncache the buffer when mutated", function() {
        const tun = XmlResource.from(Buffer.from("<T>50</T>"), { saveBuffer: true });
        expect(tun.isCached).to.be.true;
        expect(tun.content).to.equal("<T>50</T>");
        tun.dom.child.innerValue = 25;
        expect(tun.isCached).to.be.true;
        expect(tun.content).to.equal("<T>50</T>");
      });
    });

    context('setting', function() {
      it("should update the DOM", function() {
        const dom = XmlDocumentNode.from("<T>50</T>");
        const tun = XmlResource.create({ dom });
        tun.dom = XmlDocumentNode.from("<T>25</T>");
        expect(tun.dom.child.innerValue).to.equal("25");
      });

      it("should uncache the buffer", function() {
        const tun = XmlResource.from(Buffer.from("<T>50</T>"), { saveBuffer: true });
        expect(tun.isCached).to.be.true;
        tun.dom = XmlDocumentNode.from("<T>25</T>");
        expect(tun.isCached).to.be.false;
      });

      it("should reset the content", function() {
        const tun = XmlResource.from(Buffer.from("<T>50</T>"));
        expect(tun.content).to.equal(`<T>50</T>`);
        tun.dom = XmlDocumentNode.from("<T>25</T>");
        expect(tun.content).to.equal(`${XML_DECLARATION}\n<T>25</T>`);
      });
    });
  });

  describe('#root', function() {
    context('getting', function() {
      it("should return undefined if the DOM has no children", function() {
        const tun = XmlResource.create();
        expect(tun.root).to.be.undefined;
      });

      it("should return the child of the DOM if it's the only one", function() {
        const tun = XmlResource.create({ content: "<T>Hi</T>" });
        expect(tun.root.tag).to.equal("T");
        expect(tun.root.innerValue).to.equal("Hi");
      });

      it("should return the first child of the DOM if there are more than one", function() {
        const tun = XmlResource.create({ content: "<T>Hi</T><L><U/></L>" });
        expect(tun.root.tag).to.equal("T");
        expect(tun.root.innerValue).to.equal("Hi");
      });
    });

    context('setting', function() {
      it("should update the first child of the DOM", function() {
        const dom = XmlDocumentNode.from("<T>50</T>");
        const tun = XmlResource.create({ dom });
        tun.root = new XmlElementNode({
          tag: "E",
          children: [
            new XmlValueNode("VALUE")
          ]
        });
        expect(dom.child.tag).to.equal("E");
        expect(dom.child.innerValue).to.equal("VALUE");
      });

      it("should uncache the buffer", function() {
        const tun = XmlResource.from(Buffer.from("<T>50</T>"), { saveBuffer: true });
        expect(tun.isCached).to.be.true;
        tun.root = new XmlElementNode({
          tag: "E",
          children: [
            new XmlValueNode("VALUE")
          ]
        });
        expect(tun.isCached).to.be.false;
      });

      it("should reset the content", function() {
        const dom = XmlDocumentNode.from("<T>50</T>");
        const tun = XmlResource.create({ dom });
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

  describe('#buffer', function() {
    context('getting', function() {
      it("should return the buffer for an empty resource", function() {
        const tun = XmlResource.create();
        expect(tun.buffer.toString()).to.equal('');
      });

      it("should return the original buffer if saveBuffer = true", function() {
        const buffer = Buffer.from("Hello");
        const tun = XmlResource.from(buffer, { saveBuffer: true });
        expect(tun.buffer).to.equal(buffer);
      });

      it("should return a new buffer if saveBuffer = false", function() {
        const buffer = Buffer.from("Hello");
        const tun = XmlResource.from(buffer, { saveBuffer: false });
        expect(tun.buffer).to.not.equal(buffer);
      });

      it("should return the buffer for a resource created from a string", function() {
        const tun = XmlResource.create({ content: "Hello" });
        expect(tun.buffer.toString()).to.equal('Hello');
      });

      it("should return the buffer for a resource created from a DOM", function() {
        const dom = XmlDocumentNode.from("<T>50</T>");
        const tun = XmlResource.create({ dom });
        expect(tun.buffer.toString()).to.equal(`${XML_DECLARATION}\n<T>50</T>`);
      });
    });

    context('setting', function() {
      it("should not do anything", function() {
        const tun = XmlResource.from(Buffer.from("<I/>"));
        //@ts-expect-error Error is entire point of test
        expect(() => tun.buffer = Buffer.from("hi")).to.throw();
      });
    });
  });

  describe("#saveBuffer", () => {
    it("should be false by default", () => {
      const tun = XmlResource.from(getBuffer("ExampleTrait"));
      expect(tun.saveBuffer).to.be.false;
    });

    it("should delete the buffer if set to false", () => {
      const tun = XmlResource.from(getBuffer("ExampleTrait"), { saveBuffer: true });
      expect(tun.isCached).to.be.true;
      tun.saveBuffer = false;
      expect(tun.isCached).to.be.false;
    });

    it("should not generate a buffer if set to true", () => {
      const tun = XmlResource.from(getBuffer("ExampleTrait"), { saveBuffer: false });
      expect(tun.isCached).to.be.false;
      tun.saveBuffer = true;
      expect(tun.isCached).to.be.false;
    });

    it("should cache the buffer after getting it when set to true", () => {
      const tun = XmlResource.from(getBuffer("ExampleTrait"));
      tun.saveBuffer = true;
      expect(tun.isCached).to.be.false;
      tun.buffer;
      expect(tun.isCached).to.be.true;
    });

    it("should not cache the buffer after getting it when set to false", () => {
      const tun = XmlResource.from(getBuffer("ExampleTrait"));
      tun.saveBuffer = false;
      expect(tun.isCached).to.be.false;
      tun.buffer;
      expect(tun.isCached).to.be.false;
    });
  });

  //#endregion Properties

  //#region Initialization

  describe('#clone()', function() {
    it("should create a new resource with the same content and DOM", function() {
      const tun = XmlResource.create({ content: "<T>50</T>" });
      const clone = tun.clone();
      expect(clone.content).to.equal("<T>50</T>");
      expect(clone.root.tag).to.equal("T");
      expect(clone.root.innerValue).to.equal("50");
    });

    it("should not mutate the original's content", function() {
      const tun = XmlResource.create({ content: "<T>50</T>" });
      const clone = tun.clone();
      clone.content = "hello";
      expect(tun.content).to.equal("<T>50</T>");
      expect(clone.content).to.equal("hello");
    });

    it("should not mutate the original's DOM", function() {
      const dom = XmlDocumentNode.from("<T>50</T>")
      const tun = XmlResource.create({ dom });
      const clone = tun.clone();
      clone.root.innerValue = "25";
      expect(tun.root.innerValue).to.equal("50");
      expect(clone.root.innerValue).to.equal("25");
    });
  });

  describe('#create()', function() {
    context('not given any arguments', function() {
      it("should create a tuning resource with an empty DOM", function() {
        const tun = XmlResource.create();
        expect(tun.dom.numChildren).to.equal(0);
      });

      it("should create a tuning resource with empty content", function() {
        const tun = XmlResource.create();
        expect(tun.content).to.equal('');
      });

      it("should not cache buffers that are created", () => {
        const tun = XmlResource.create();
        expect(tun.isCached).to.be.false;
        const buffer = tun.buffer;
        expect(tun.isCached).to.be.false;
        expect(buffer).to.not.equal(tun.buffer);
      });
    });

    context('given content', function() {
      it("should create a tuning resource with the given content", function() {
        const tun = XmlResource.create({ content: "hi" });
        expect(tun.content).to.equal("hi");
      });

      it("should generate a DOM from the content", function() {
        const tun = XmlResource.create({ content: "<I><T>50</T></I>" });
        expect(tun.dom.numChildren).to.equal(1);
        expect(tun.dom.child.child.innerValue).to.equal("50");
      });
    });

    context('given DOM', function() {
      it("should create a tuning resource with the given DOM", function() {
        const dom = XmlDocumentNode.from(`<I n="some_file"/>`);
        const tun = XmlResource.create({ dom });
        expect(tun.dom.numChildren).to.equal(1);
        expect(tun.root.name).to.equal("some_file");
      });

      it("should generate content from the DOM", function() {
        const dom = XmlDocumentNode.from(`<I n="some_file"/>`);
        const tun = XmlResource.create({ dom });
        expect(tun.content).to.equal(`${XML_DECLARATION}\n<I n="some_file"/>`);
      });
    });

    context('given content and DOM that match', function() {
      it("should create a tuning resource with the given content and DOM", function() {
        const content = `${XML_DECLARATION}\n<I n="some_file"/>`;
        const dom = XmlDocumentNode.from(`<I n="some_file"/>`);
        const tun = XmlResource.create({ content, dom });
        expect(tun.content).to.equal(content);
        expect(tun.dom).to.equal(dom);
      });
    });

    context('given content and DOM that don\'t match', function() {
      it("should create a tuning resource with the given content and DOM", function() {
        const content = `something`;
        const dom = XmlDocumentNode.from(`<I n="some_file"/>`);
        const tun = XmlResource.create({ content, dom });
        expect(tun.content).to.equal(content);
        expect(tun.dom).to.equal(dom);
      });
    });

    context("given saveBuffer = true", () => {
      it("should cache buffers that are created", () => {
        const tun = XmlResource.create({ saveBuffer: true });
        expect(tun.isCached).to.be.false;
        const buffer = tun.buffer;
        expect(tun.isCached).to.be.true;
        expect(buffer).to.equal(tun.buffer);
      });
    });

    context("given saveBuffer = false", () => {
      it("should not cache buffers that are created", () => {
        const tun = XmlResource.create({ saveBuffer: false });
        expect(tun.isCached).to.be.false;
        const buffer = tun.buffer;
        expect(tun.isCached).to.be.false;
        expect(buffer).to.not.equal(tun.buffer);
      });
    });
  });

  describe('#from()', function() {
    it("should create a tuning resource with the content of the given buffer", function() {
      const tun = XmlResource.from(Buffer.from("Hello"));
      expect(tun.content).to.equal("Hello");
    });

    it("should cache the buffer if saveBuffer = true", function() {
      const tun = XmlResource.from(Buffer.from("Hello"), { saveBuffer: true });
      expect(tun.isCached).to.be.true;
    });

    it("should not cache the buffer if saveBuffer = false", function() {
      const tun = XmlResource.from(Buffer.from("Hello"), { saveBuffer: false });
      expect(tun.isCached).to.be.false;
    });

    it("should not cache the buffer by default", function() {
      const tun = XmlResource.from(Buffer.from("Hello"));
      expect(tun.isCached).to.be.false;
    });

    it('should be able to handle real files', function() {
      const tun = getTuningFromFile("ExampleTrait");

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

  //#endregion Initialization

  //#region Methods

  describe("#equals()", () => {
    it("should return true if the contents are the same", () => {
      const tuning = XmlResource.create({
        content: "<I>something</I>"
      });

      expect(tuning.equals(tuning.clone())).to.be.true;
    });

    it("should return false if the contents are different", () => {
      const tuning = XmlResource.create({
        content: "<I>something</I>"
      });

      const other = XmlResource.create({
        content: "<I>something_else</I>"
      });

      expect(tuning.equals(other)).to.be.false;
    });
  });

  describe("#isXml()", () => {
    it("should return true", () => {
      const tuning = XmlResource.create();
      expect(tuning.isXml()).to.be.true;
    });
  });

  describe('#updateDom()', function() {
    it('should uncache the buffer', function() {
      const tun = XmlResource.from(Buffer.from("<T>50</T>"), { saveBuffer: true });
      expect(tun.isCached).to.be.true;
      tun.updateDom(dom => {
        dom.child.innerValue = 25;
      });
      expect(tun.isCached).to.be.false;
    });

    it('should update the DOM', function() {
      const tun = XmlResource.from(Buffer.from("<T>50</T>"));
      tun.updateDom(dom => {
        dom.child.innerValue = 25;
      });
      expect(tun.dom.child.innerValue).to.equal(25);
    });

    it('should reset the content', function() {
      const tun = XmlResource.from(Buffer.from("<T>50</T>"));
      tun.updateDom(dom => {
        dom.child.innerValue = 25;
      });
      expect(tun.content).to.equal(`${XML_DECLARATION}\n<T>25</T>`);
    });
  });

  describe('#updateRoot()', function() {
    it('should uncache the buffer', function() {
      const tun = XmlResource.from(Buffer.from("<T>50</T>"), { saveBuffer: true });
      expect(tun.isCached).to.be.true;
      tun.updateRoot(root => {
        root.innerValue = 25;
      });
      expect(tun.isCached).to.be.false;
    });

    it('should update the root', function() {
      const tun = XmlResource.from(Buffer.from("<T>50</T>"));
      tun.updateRoot(root => {
        root.innerValue = 25;
      });
      expect(tun.root.innerValue).to.equal(25);
    });

    it('should reset the content', function() {
      const tun = XmlResource.from(Buffer.from("<T>50</T>"));
      tun.updateRoot(root => {
        root.innerValue = 25;
      });
      expect(tun.content).to.equal(`${XML_DECLARATION}\n<T>25</T>`);
    });
  });

  describe('#onChange()', function() {
    it('should uncache the buffer', function() {
      const tun = XmlResource.from(Buffer.from("Hello"), { saveBuffer: true });
      expect(tun.isCached).to.be.true;
      tun.onChange();
      expect(tun.isCached).to.be.false;
    });
  });

  //#endregion Methods
});
