const expect = require('chai').expect;
const { TuningResource } = require('../../../dst/api');

function getTuning(content) {
  return TuningResource.fromXml(content);
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
    // TODO:
  });

  describe('#dom', function() {
    // TODO:
  });

  describe('#hasChanged', function() {
    // TODO:
  });

  describe('#buffer', function() {
    // TODO:
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

  describe('#fromXml()', function() {
    // TODO:
  });

  describe('#fromNodes()', function() {
    // TODO:
  });

  describe('#fromDom()', function() {
    // TODO:
  });

  //#endregion Initialization

  //#region Methods

  describe('#updateDom()', function() {
    // TODO:
  });

  //#endregion Methods
});
