const expect = require('chai').expect;
const { TuningResource } = require('../../../dst/api');

function getTuning(content) {
  return TuningResource.create({ content });
}

describe('TuningResource', function() {
  //#region Properties

  describe('#variant', function() {
    it('should be "XML" when created', function() {
      const tun = TuningResource.create();
      expect(tun.variant).to.equal("XML");
    });

    it('should be "XML" when loaded', function() {
      const tun = getTuning("file content");
      expect(tun.variant).to.equal("XML");
    });
  });

  describe('#content', function() {
    context('getting', function() {
      it("should return an empty string for an empty resource", function() {
        // TODO:
      });

      it("should return the content for tuning created from a buffer", function() {
        // TODO:
      });

      it("should return the content for tuning created from a string", function() {
        // TODO:
      });

      it("should return the content for tuning created from a DOM", function() {
        // TODO:
      });
    });

    context('setting', function() {
      it("should update the content", function() {
        // TODO:
      });

      it("should uncache the buffer", function() {
        // TODO:
      });

      it("should reset the DOM", function() {
        // TODO:
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

  describe('#hasChanged', function() {
    context('getting', function() {
      it("should return true after being created", function() {
        // TODO:
      });

      it("should return false after being loaded from a buffer", function() {
        // TODO:
      });

      it("should return true after content is changed", function() {
        // TODO:
      });

      it("should return true after DOM is changed in updateDom", function() {
        // TODO:
      });

      it("should return false after DOM is mutated unsafely", function() {
        // TODO:
      });
    });

    context('setting', function() {
      it("should throw", function() {
        const tun = getTuning("<I/>");
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
        const tun = getTuning("<I/>");
        expect(() => tun.buffer = Buffer.from("hi")).to.throw;
      });
    });
  });

  //#endregion Properties

  //#region Initialization

  describe('#clone()', function() {
    // TODO:
  });

  describe('#create()', function() {
    // TODO:
  });

  describe('#from()', function() {
    // TODO:
  });

  //#endregion Initialization

  //#region Methods

  describe('#updateDom()', function() {
    // TODO:
  });

  //#endregion Methods
});
