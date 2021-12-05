const { expect } = require("chai");
const { nodes } = require("../../../dst/api");

const {
  TuningDocumentNode,
  TuningElementNode,
  TuningValueNode,
  TuningCommentNode
} = nodes;

// TODO: TuningDocumentNode

describe('TuningElementNode', function() {
  const newNode = options => new TuningElementNode(options);
  const newNodeWithTag = (tag = "T") => newNode({ tag });

  describe('#constructor', function() {
    it('should throw when no tag is given', function () {
      // TODO:
    });

    it('should throw when tag is an empty string', function () {
      // TODO:
    });

    it('should not throw when no attributes are given', function () {
      // TODO:
    });

    it('should not throw when no children are given', function () {
      // TODO:
    });

    it('should create a new node with all of the given values', function () {
      // TODO:
    });
  });

  describe('#attributes', function() {
    it('should throw when trying to set', function () {
      // TODO:
    });

    it('should not be undefined when there are no attributes', function () {
      // TODO:
    });

    it('should allow mutation', function () {
      // TODO:
    });
  });

  describe('#child', function() {
    it('should FAIL', function () {
      // TODO:
    });
  });

  describe('#children', function() {
    it('should FAIL', function () {
      // TODO:
    });
  });

  describe('#hasChildren', function() {
    it('should FAIL', function () {
      // TODO:
    });
  });

  describe('#id', function() {
    it('should FAIL', function () {
      // TODO:
    });
  });

  describe('#innerValue', function() {
    it('should FAIL', function () {
      // TODO:
    });
  });

  describe('#name', function() {
    it('should FAIL', function () {
      // TODO:
    });
  });

  describe('#numChildren', function() {
    it('should FAIL', function () {
      // TODO:
    });
  });

  describe('#tag', function() {
    it('should FAIL', function () {
      // TODO:
    });
  });

  describe('#type', function() {
    it('should FAIL', function () {
      // TODO:
    });
  });

  describe('#value', function() {
    it('should FAIL', function () {
      // TODO:
    });
  });

  describe('#addChildren()', function() {
    it('should FAIL', function () {
      // TODO:
    });
  });

  describe('#addClones()', function() {
    it('should FAIL', function () {
      // TODO:
    });
  });

  describe('#clone()', function() {
    it('should FAIL', function () {
      // TODO:
    });
  });

  describe('#deepSort()', function() {
    it('should FAIL', function () {
      // TODO:
    });
  });

  describe('#sort()', function() {
    it('should FAIL', function () {
      // TODO:
    });
  });

  describe('#toXml()', function() {
    it('should FAIL', function () {
      // TODO:
    });
  });
});
