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
});
