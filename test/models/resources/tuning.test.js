const expect = require('chai').expect;
const { TuningResource, nodes } = require('../../../dst/api');
const { TuningDocumentNode } = nodes;

const XML_DECLARATION = '<?xml version="1.0" encoding="utf-8"?>';

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
        const dom = TuningDocumentNode.from(`<I n="some_file"></I>`);
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
        // TODO:
      });

      it("should return the DOM for tuning created from a buffer", function() {
        // TODO:
      });

      it("should return the DOM for tuning created from a string", function() {
        // TODO:
      });

      it("should return the original DOM for tuning created from a DOM", function() {
        // TODO:
      });

      it("should not reset the content or uncache the buffer when mutated", function() {
        // TODO:
      });
    });

    context('setting', function() {
      it("should update the DOM", function() {
        // TODO:
      });

      it("should uncache the buffer", function() {
        // TODO:
      });

      it("should reset the content", function() {
        // TODO:
      });
    });
  });

  describe('#root', function() {
    context('getting', function() {
      it("should return undefined if the DOM has no children", function() {
        // TODO:
      });

      it("should return the child of the DOM if it's the only one", function() {
        // TODO:
      });

      it("should return the first child of the DOM if there are more than one", function() {
        // TODO:
      });
    });

    context('setting', function() {
      it("should update the first child of the DOM", function() {
        // TODO:
      });

      it("should uncache the buffer", function() {
        // TODO:
      });

      it("should reset the content", function() {
        // TODO:
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
        expect(() => tun.hasChanged = true).to.throw;
      });
    });
  });

  describe('#buffer', function() {
    context('getting', function() {
      it("should return the buffer for an empty resource", function() {
        // TODO:
      });

      it("should return the original buffer for a resource created from a buffer", function() {
        // TODO:
      });

      it("should return the buffer for a resource created from a string", function() {
        // TODO:
      });

      it("should return the buffer for a resource created from a DOM", function() {
        // TODO:
      });
    });

    context('setting', function() {
      it("should throw", function() {
        const tun = TuningResource.create({ content: "<I/>" });
        expect(() => tun.buffer = Buffer.from("hi")).to.throw;
      });
    });
  });

  //#endregion Properties

  //#region Initialization

  describe('#clone()', function() {
    it("should create a new resource with the same content, buffer, and DOM", function() {
      // TODO:
    });

    it("should not mutate the original's content", function() {
      // TODO:
    });

    it("should not uncache the original's buffer", function() {
      // TODO:
    });

    it("should not mutate the original's DOM", function() {
      // TODO:
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
        const dom = TuningDocumentNode.from(`<I n="some_file"/>`);
        const tun = TuningResource.create({ dom });
        expect(tun.dom.numChildren).to.equal(1);
        expect(tun.root.name).to.equal("some_file");
      });

      it("should generate content from the DOM", function() {
        const dom = TuningDocumentNode.from(`<I n="some_file"/>`);
        const tun = TuningResource.create({ dom });
        expect(tun.content).to.equal(`${XML_DECLARATION}\n<I n="some_file"/>`);
      });
    });

    context('given content and DOM that match', function() {
      it("should create a tuning resource with the given content and DOM", function() {
        const content = `${XML_DECLARATION}\n<I n="some_file"/>`;
        const dom = TuningDocumentNode.from(`<I n="some_file"/>`);
        const tun = TuningResource.create({ content, dom });
        expect(tun.content).to.equal(content);
        expect(tun.dom).to.equal(dom);
      });
    });

    context('given content and DOM that don\'t match', function() {
      it("should create a tuning resource with the given content and DOM", function() {
        const content = `something`;
        const dom = TuningDocumentNode.from(`<I n="some_file"/>`);
        const tun = TuningResource.create({ content, dom });
        expect(tun.content).to.equal(content);
        expect(tun.dom).to.equal(dom);
      });
    });
  });

  describe('#from()', function() {
    it("should create a tuning resource with the content of the given buffer", function() {
      // TODO:
    });

    it("should immediately cache the buffer", function() {
      // TODO:
    });
  });

  //#endregion Initialization

  //#region Methods

  describe('#updateDom()', function() {
    it('should uncache the buffer', function() {
      // TODO:
    });

    it('should reset the content', function() {
      // TODO:
    });
  });

  describe('#updateRoot()', function() {
    it('should uncache the buffer', function() {
      // TODO:
    });

    it('should reset the content', function() {
      // TODO:
    });
  });

  describe('#uncache()', function() {
    it('should uncache the buffer', function() {
      // TODO:
    });
  });

  //#endregion Methods
});
