const expect = require('chai').expect;
const { TuningResource } = require('../../../dst/api');

function getTuning(content) {
  return TuningResource.from(Buffer.from(content));
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

  //#endregion Properties

  //#region Initialization

  describe('#clone()', function() {
    // TODO:
  });

  describe('#from()', function() {
    // TODO:
  });

  describe('#create()', function() {
    // TODO:
  });

  //#endregion Initialization

  //#region Getters

  describe('#getContent()', function() {
    // TODO:
  });

  describe('#getFileName()', function() {
    // TODO:
  });

  describe('#getClassName()', function() {
    // TODO:
  });

  describe('#getTypeName()', function() {
    // TODO:
  });

  describe('#getModulePath()', function() {
    // TODO:
  });

  describe('#getTuningId()', function() {
    // TODO:
  });

  //#endregion Getters

  //#region Setters

  describe('#updateContent()', function() {
    // TODO:
  });

  //#endregion Setters

  //#region Utility

  describe('#hasChanged()', function() {
    // TODO:
  });

  describe('#getBuffer()', function() {
    // TODO:
  });

  //#endregion Utility
});
