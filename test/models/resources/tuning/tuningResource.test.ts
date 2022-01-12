import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import { XmlDocumentNode } from "@s4tk/utils/xml";
import { TuningResource, tunables } from '../../../../dst/api';

const XML_DECLARATION = '<?xml version="1.0" encoding="utf-8"?>';

function getTuningFromFile(filename) {
  const filepath = path.resolve(__dirname, `../../../data/tuning/${filename}.xml`);
  const buffer = fs.readFileSync(filepath);
  return TuningResource.from(buffer);
}

describe('TuningResource', function() {
  //#region Properties

  describe('#variant', function() {
    it('should be "XML" when created', function() {
      const tun = TuningResource.create();
      expect(tun.variant).to.equal("XML");
    });

    it('should be "XML" when loaded', function() {
      const tun = TuningResource.from(Buffer.from("file content"));
      expect(tun.variant).to.equal("XML");
    });
  });

  describe('#content', function() {
    context('getting', function() {
      it("should return an empty string for an empty resource", function() {
        const tun = TuningResource.create();
        expect(tun.content).to.equal('');
      });

      it("should return the content for tuning created from a buffer", function() {
        const buffer = Buffer.from(`<I n="some_file"></I>`);
        const tun = TuningResource.from(buffer);
        expect(tun.content).to.equal(`<I n="some_file"></I>`);
      });

      it("should return the content for tuning created from a string", function() {
        const tun = TuningResource.create({ content: `<I n="some_file"></I>` });
        expect(tun.content).to.equal(`<I n="some_file"></I>`);
      });

      it("should return the content for tuning created from a DOM", function() {
        const dom = XmlDocumentNode.from(`<I n="some_file"></I>`);
        const tun = TuningResource.create({ dom });
        expect(tun.content).to.equal(`${XML_DECLARATION}\n<I n="some_file"/>`)
      });
    });

    context('setting', function() {
      it("should update the content", function() {
        const tun = TuningResource.create();
        expect(tun.content).to.equal("");
        tun.content = "<I/>";
        expect(tun.content).to.equal("<I/>");
      });

      it("should uncache the buffer", function() {
        const buffer = Buffer.from("hi");
        const tun = TuningResource.from(buffer);
        expect(tun.hasChanged).to.be.false;
        tun.content = "hello";
        expect(tun.hasChanged).to.be.true;
      });

      it("should reset the DOM", function() {
        const tun = TuningResource.create({ content: "<T>50</T>" });
        expect(tun.dom.child.innerValue).to.equal("50");
        tun.content = "<T>25</T>";
        expect(tun.dom.child.innerValue).to.equal("25");
      });
    });
  });

  describe('#dom', function() {
    context('getting', function() {
      it("should return an empty DOM for an empty resource", function() {
        const tun = TuningResource.create();
        expect(tun.dom.numChildren).to.equal(0);
      });

      it("should return the DOM for tuning created from a buffer", function() {
        const tun = TuningResource.from(Buffer.from("<T>50</T>"));
        expect(tun.dom.child.tag).to.equal("T");
        expect(tun.dom.child.innerValue).to.equal("50");
      });

      it("should return the DOM for tuning created from a string", function() {
        const tun = TuningResource.create({ content: "<T>50</T>" });
        expect(tun.dom.child.tag).to.equal("T");
        expect(tun.dom.child.innerValue).to.equal("50");
      });

      it("should return the original DOM for tuning created from a DOM", function() {
        const dom = XmlDocumentNode.from("<T>50</T>");
        const tun = TuningResource.create({ dom });
        expect(tun.dom).to.equal(dom);
      });

      it("should not reset the content or uncache the buffer when mutated", function() {
        const tun = TuningResource.from(Buffer.from("<T>50</T>"));
        expect(tun.hasChanged).to.be.false;
        expect(tun.content).to.equal("<T>50</T>");
        tun.dom.child.innerValue = 25;
        expect(tun.hasChanged).to.be.false;
        expect(tun.content).to.equal("<T>50</T>");
      });
    });

    context('setting', function() {
      it("should update the DOM", function() {
        const dom = XmlDocumentNode.from("<T>50</T>");
        const tun = TuningResource.create({ dom });
        tun.dom = XmlDocumentNode.from("<T>25</T>");
        expect(tun.dom.child.innerValue).to.equal("25");
      });

      it("should uncache the buffer", function() {
        const tun = TuningResource.from(Buffer.from("<T>50</T>"));
        expect(tun.hasChanged).to.be.false;
        tun.dom = XmlDocumentNode.from("<T>25</T>");
        expect(tun.hasChanged).to.be.true;
      });

      it("should reset the content", function() {
        const tun = TuningResource.from(Buffer.from("<T>50</T>"));
        expect(tun.content).to.equal(`<T>50</T>`);
        tun.dom = XmlDocumentNode.from("<T>25</T>");
        expect(tun.content).to.equal(`${XML_DECLARATION}\n<T>25</T>`);
      });
    });
  });

  describe('#root', function() {
    context('getting', function() {
      it("should return undefined if the DOM has no children", function() {
        const tun = TuningResource.create();
        expect(tun.root).to.be.undefined;
      });

      it("should return the child of the DOM if it's the only one", function() {
        const tun = TuningResource.create({ content: "<T>Hi</T>" });
        expect(tun.root.tag).to.equal("T");
        expect(tun.root.innerValue).to.equal("Hi");
      });

      it("should return the first child of the DOM if there are more than one", function() {
        const tun = TuningResource.create({ content: "<T>Hi</T><L><U/></L>" });
        expect(tun.root.tag).to.equal("T");
        expect(tun.root.innerValue).to.equal("Hi");
      });
    });

    context('setting', function() {
      it("should update the first child of the DOM", function() {
        const dom = XmlDocumentNode.from("<T>50</T>");
        const tun = TuningResource.create({ dom });
        tun.root = tunables.E({ value: "VALUE" });
        expect(dom.child.tag).to.equal("E");
        expect(dom.child.innerValue).to.equal("VALUE");
      });

      it("should uncache the buffer", function() {
        const tun = TuningResource.from(Buffer.from("<T>50</T>"));
        expect(tun.hasChanged).to.be.false;
        tun.root = tunables.E({ value: "VALUE" });
        expect(tun.hasChanged).to.be.true;
      });

      it("should reset the content", function() {
        const dom = XmlDocumentNode.from("<T>50</T>");
        const tun = TuningResource.create({ dom });
        expect(tun.content).to.equal(`${XML_DECLARATION}\n<T>50</T>`);
        tun.root = tunables.E({ value: "VALUE" });
        expect(tun.content).to.equal(`${XML_DECLARATION}\n<E>VALUE</E>`);
      });
    });
  });

  describe('#hasChanged', function() {
    context('getting', function() {
      it("should return true after being created", function() {
        const tun = TuningResource.create();
        expect(tun.hasChanged).to.be.true;
      });

      it("should return false after being loaded from a buffer", function() {
        const tun = TuningResource.from(Buffer.from("hi"));
        expect(tun.hasChanged).to.be.false;
      });

      it("should return true after content is changed", function() {
        const tun = TuningResource.from(Buffer.from("hi"));
        expect(tun.hasChanged).to.be.false;
        tun.content = "hello";
        expect(tun.hasChanged).to.be.true;
      });

      it("should return true after DOM is changed in updateDom", function() {
        const tun = TuningResource.from(Buffer.from("<T>Hi</T>"));
        expect(tun.hasChanged).to.be.false;
        tun.updateDom(dom => {
          dom.child.innerValue = "Bye";
        });
        expect(tun.hasChanged).to.be.true;
      });

      it("should return false after DOM is mutated unsafely", function() {
        const tun = TuningResource.from(Buffer.from("<T>Hi</T>"));
        expect(tun.hasChanged).to.be.false;
        tun.dom.child.innerValue = "Bye";
        expect(tun.hasChanged).to.be.false;
      });
    });

    context('setting', function() {
      it("should throw", function() {
        const tun = TuningResource.create({ content: "<I/>" });
        expect(tun.hasChanged).to.be.true;
        //@ts-expect-error Error is entire point of test
        expect(() => tun.hasChanged = false).to.throw();
      });
    });
  });

  describe('#buffer', function() {
    context('getting', function() {
      it("should return the buffer for an empty resource", function() {
        const tun = TuningResource.create();
        expect(tun.buffer.toString()).to.equal('');
      });

      it("should return the original buffer for a resource created from a buffer", function() {
        const buffer = Buffer.from("Hello");
        const tun = TuningResource.from(buffer);
        expect(tun.buffer).to.equal(buffer);
      });

      it("should return the buffer for a resource created from a string", function() {
        const tun = TuningResource.create({ content: "Hello" });
        expect(tun.buffer.toString()).to.equal('Hello');
      });

      it("should return the buffer for a resource created from a DOM", function() {
        const dom = XmlDocumentNode.from("<T>50</T>");
        const tun = TuningResource.create({ dom });
        expect(tun.buffer.toString()).to.equal(`${XML_DECLARATION}\n<T>50</T>`);
      });
    });

    context('setting', function() {
      it("should not do anything", function() {
        const tun = TuningResource.from(Buffer.from("<I/>"));
        //@ts-expect-error Error is entire point of test
        expect(() => tun.buffer = Buffer.from("hi")).to.throw();
      });
    });
  });

  //#endregion Properties

  //#region Initialization

  describe('#clone()', function() {
    it("should create a new resource with the same content and DOM", function() {
      const tun = TuningResource.create({ content: "<T>50</T>" });
      const clone = tun.clone();
      expect(clone.content).to.equal("<T>50</T>");
      expect(clone.root.tag).to.equal("T");
      expect(clone.root.innerValue).to.equal("50");
    });

    it("should not transfer the buffer to the clone", function() {
      const tun = TuningResource.from(Buffer.from("hello"));
      expect(tun.hasChanged).to.be.false;
      const clone = tun.clone()
      expect(clone.hasChanged).to.be.true;
    });

    it("should not mutate the original's content", function() {
      const tun = TuningResource.create({ content: "<T>50</T>" });
      const clone = tun.clone();
      clone.content = "hello";
      expect(tun.content).to.equal("<T>50</T>");
      expect(clone.content).to.equal("hello");
    });

    it("should not uncache the original's buffer", function() {
      const tun = TuningResource.from(Buffer.from("hello"));
      expect(tun.hasChanged).to.be.false;
      tun.clone()
      expect(tun.hasChanged).to.be.false;
    });

    it("should not mutate the original's DOM", function() {
      const dom = XmlDocumentNode.from("<T>50</T>")
      const tun = TuningResource.create({ dom });
      const clone = tun.clone();
      clone.root.innerValue = "25";
      expect(tun.root.innerValue).to.equal("50");
      expect(clone.root.innerValue).to.equal("25");
    });
  });

  describe('#create()', function() {
    context('not given any arguments', function() {
      it("should create a tuning resource with an empty DOM", function() {
        const tun = TuningResource.create();
        expect(tun.dom.numChildren).to.equal(0);
      });

      it("should create a tuning resource with empty content", function() {
        const tun = TuningResource.create();
        expect(tun.content).to.equal('');
      });
    });

    context('given content', function() {
      it("should create a tuning resource with the given content", function() {
        const tun = TuningResource.create({ content: "hi" });
        expect(tun.content).to.equal("hi");
      });

      it("should generate a DOM from the content", function() {
        const tun = TuningResource.create({ content: "<I><T>50</T></I>" });
        expect(tun.dom.numChildren).to.equal(1);
        expect(tun.dom.child.child.innerValue).to.equal("50");
      });
    });

    context('given DOM', function() {
      it("should create a tuning resource with the given DOM", function() {
        const dom = XmlDocumentNode.from(`<I n="some_file"/>`);
        const tun = TuningResource.create({ dom });
        expect(tun.dom.numChildren).to.equal(1);
        expect(tun.root.name).to.equal("some_file");
      });

      it("should generate content from the DOM", function() {
        const dom = XmlDocumentNode.from(`<I n="some_file"/>`);
        const tun = TuningResource.create({ dom });
        expect(tun.content).to.equal(`${XML_DECLARATION}\n<I n="some_file"/>`);
      });
    });

    context('given content and DOM that match', function() {
      it("should create a tuning resource with the given content and DOM", function() {
        const content = `${XML_DECLARATION}\n<I n="some_file"/>`;
        const dom = XmlDocumentNode.from(`<I n="some_file"/>`);
        const tun = TuningResource.create({ content, dom });
        expect(tun.content).to.equal(content);
        expect(tun.dom).to.equal(dom);
      });
    });

    context('given content and DOM that don\'t match', function() {
      it("should create a tuning resource with the given content and DOM", function() {
        const content = `something`;
        const dom = XmlDocumentNode.from(`<I n="some_file"/>`);
        const tun = TuningResource.create({ content, dom });
        expect(tun.content).to.equal(content);
        expect(tun.dom).to.equal(dom);
      });
    });
  });

  describe('#from()', function() {
    it("should create a tuning resource with the content of the given buffer", function() {
      const tun = TuningResource.from(Buffer.from("Hello"));
      expect(tun.content).to.equal("Hello");
    });

    it("should immediately cache the buffer", function() {
      const tun = TuningResource.from(Buffer.from("Hello"));
      expect(tun.hasChanged).to.be.false;
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

  describe('#updateDom()', function() {
    it('should uncache the buffer', function() {
      const tun = TuningResource.from(Buffer.from("<T>50</T>"));
      expect(tun.hasChanged).to.be.false;
      tun.updateDom(dom => {
        dom.child.innerValue = 25;
      });
      expect(tun.hasChanged).to.be.true;
    });

    it('should update the DOM', function() {
      const tun = TuningResource.from(Buffer.from("<T>50</T>"));
      tun.updateDom(dom => {
        dom.child.innerValue = 25;
      });
      expect(tun.dom.child.innerValue).to.equal(25);
    });

    it('should reset the content', function() {
      const tun = TuningResource.from(Buffer.from("<T>50</T>"));
      tun.updateDom(dom => {
        dom.child.innerValue = 25;
      });
      expect(tun.content).to.equal(`${XML_DECLARATION}\n<T>25</T>`);
    });
  });

  describe('#updateRoot()', function() {
    it('should uncache the buffer', function() {
      const tun = TuningResource.from(Buffer.from("<T>50</T>"));
      expect(tun.hasChanged).to.be.false;
      tun.updateRoot(root => {
        root.innerValue = 25;
      });
      expect(tun.hasChanged).to.be.true;
    });

    it('should update the root', function() {
      const tun = TuningResource.from(Buffer.from("<T>50</T>"));
      tun.updateRoot(root => {
        root.innerValue = 25;
      });
      expect(tun.root.innerValue).to.equal(25);
    });

    it('should reset the content', function() {
      const tun = TuningResource.from(Buffer.from("<T>50</T>"));
      tun.updateRoot(root => {
        root.innerValue = 25;
      });
      expect(tun.content).to.equal(`${XML_DECLARATION}\n<T>25</T>`);
    });
  });

  describe('#uncache()', function() {
    it('should uncache the buffer', function() {
      const tun = TuningResource.from(Buffer.from("Hello"));
      expect(tun.hasChanged).to.be.false;
      tun.uncache();
      expect(tun.hasChanged).to.be.true;
    });
  });

  //#endregion Methods
});
