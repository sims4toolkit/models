const { expect } = require("chai");
const { nodes } = require("../../../dst/api");

const {
  TuningDocumentNode,
  TuningElementNode,
  TuningValueNode,
  TuningCommentNode
} = nodes;

describe('TuningDocumentNode', function() {
  const newNode = (...children) => new TuningDocumentNode(children);

  describe('#constructor', function() {
    it('should not throw when no children are given', function () {
      // TODO:
    });

    it('should add the children that are given', function () {
      // TODO:
    });
  });

  describe('#attributes', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.attributes = {}).to.throw;
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.attributes).to.be.undefined;
    });
  });

  describe('#child', function() {
    it('should FAIL', function () {
      // TODO:
    });
  });

  describe('#children', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.children = []).to.throw;
    });

    it('should FAIL', function () {
      // TODO:
    });
  });

  describe('#hasChildren', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.children = []).to.throw;
    });

    it('should return true when it has children', function () {
      const node = newNode(newNode(), newNode());
      expect(node.hasChildren).to.be.true;
    });

    it('should return true when it does not have children', function () {
      // this test is not a typo, the hasChildren getter returns if there is
      // a children ARRAY -- it does not have to have any items in it
      const node = newNode();
      expect(node.hasChildren).to.be.true;
    });
  });

  describe('#id', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.id = 123).to.throw;
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.id).to.be.undefined;
    });
  });

  describe('#innerValue', function() {
    it('should FAIL', function () {
      // TODO:
    });
  });

  describe('#name', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.name = "name").to.throw;
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.name).to.be.undefined;
    });
  });

  describe('#numChildren', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.numChildren = 5).to.throw;
    });

    it('should FAIL', function () {
      // TODO:
    });
  });

  describe('#tag', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.tag = "T").to.throw;
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.tag).to.be.undefined;
    });
  });

  describe('#type', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.type = "enabled").to.throw;
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.type).to.be.undefined;
    });
  });

  describe('#value', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.value = "test").to.throw;
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.value).to.be.undefined;
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
      const node = newNodeWithTag();
      expect(() => node.attributes = {}).to.throw;
    });

    it('should not be undefined when there are no attributes', function () {
      const node = newNodeWithTag();
      expect(node.attributes).to.not.be.undefined;
    });

    it('should allow mutation', function () {
      const node = new TuningElementNode({
        tag: 'T',
        attributes: { n: "name", t: "enabled" }
      });

      expect(node.attributes.t).to.equal("enabled");
      node.attributes.t = "disabled";
      expect(node.attributes.t).to.equal("disabled");
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
    it('should throw when trying to set', function () {
      const node = newNodeWithTag();
      expect(() => node.children = []).to.throw;
    });

    it('should return true when it has children', function () {
      const node = newNodeWithTag(newNodeWithTag(), newNodeWithTag());
      expect(node.hasChildren).to.be.true;
    });

    it('should return true when it does not have children', function () {
      // this test is not a typo, the hasChildren getter returns if there is
      // a children ARRAY -- it does not have to have any items in it
      const node = newNodeWithTag();
      expect(node.hasChildren).to.be.true;
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

describe('TuningValueNode', function() {
  const newNode = (value = "test") => new TuningValueNode(value);

  describe('#constructor', function() {
    it('should throw when no value is given', function () {
      expect(() => new TuningValueNode()).to.throw;
    });

    it('should use the value that is given', function () {
      const node1 = new TuningValueNode("hello");
      expect(node1.value).to.equal("hello");
      const node2 = new TuningValueNode(123n);
      expect(node2.value).to.equal(123n);
    });
  });

  describe('#attributes', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.attributes = {}).to.throw;
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.attributes).to.be.undefined;
    });
  });

  describe('#child', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.child = newNode()).to.throw;
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.child).to.be.undefined;
    });
  });

  describe('#children', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.children = []).to.throw;
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.children).to.be.undefined;
    });
  });

  describe('#hasChildren', function() {
    it('should be false', function () {
      const node = newNode();
      expect(node.hasChildren).to.be.false;
    });
  });

  describe('#id', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.id = 123n).to.throw;
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.id).to.be.undefined;
    });
  });

  describe('#innerValue', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.innerValue = 123n).to.throw;
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.innerValue).to.be.undefined;
    });
  });

  describe('#name', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.name = "name").to.throw;
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.name).to.be.undefined;
    });
  });

  describe('#numChildren', function() {
    it('should be 0', function () {
      const node = newNode();
      expect(node.numChildren).to.equal(0);
    });
  });

  describe('#tag', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.tag = "tag").to.throw;
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.tag).to.be.undefined;
    });
  });

  describe('#type', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.type = "enabled").to.throw;
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.type).to.be.undefined;
    });
  });

  describe('#value', function() {
    it('should change the value when set', function () {
      const node = newNode("hello");
      expect(node.value).to.equal("hello");
      node.value = "goodbye";
      expect(node.value).to.equal("goodbye");
    });

    it('should return the current value', function () {
      const node = newNode("hello");
      expect(node.value).to.equal("hello");
    });
  });

  describe('#addChildren()', function() {
    it('should throw when no children are given', function () {
      const node = newNode();
      expect(() => node.addChildren()).to.throw;
    });

    it('should throw when children are given', function () {
      const node = newNode();
      expect(() => node.addChildren(newNode(), newNode())).to.throw;
    });
  });

  describe('#addClones()', function() {
    it('should throw when no children are given', function () {
      const node = newNode();
      expect(() => node.addClones()).to.throw;
    });

    it('should throw when children are given', function () {
      const node = newNode();
      expect(() => node.addClones(newNode(), newNode())).to.throw;
    });
  });

  describe('#clone()', function() {
    it('should return a new node with the same value as this one', function () {
      const node = newNode();
      expect(node.value).to.equal("test");
      const clone = node.clone();
      expect(clone.value).to.equal("test");
    });

    it('should not mutate the original', function () {
      const node = newNode();
      const clone = node.clone();
      expect(node.value).to.equal("test");
      expect(clone.value).to.equal("test");
      clone.value = 123n;
      expect(node.value).to.equal("test");
      expect(clone.value).to.equal(123n);
    });
  });

  describe('#deepSort()', function() {
    it('should throw', function () {
      const node = newNode();
      expect(() => node.deepSort()).to.throw;
    });
  });

  describe('#sort()', function() {
    it('should throw', function () {
      const node = newNode();
      expect(() => node.sort()).to.throw;
    });
  });

  describe('#toXml()', function() {
    it('should not indent if the given number is 0', function () {
      const node = newNode();
      expect(node.toXml()).to.equal('test');
    });

    it('should use a default indentation of 2 spaces', function () {
      const node = newNode();
      expect(node.toXml({ indents: 1 })).to.equal('  test');
    });

    it('should use the number of spaces that are provided', function () {
      const node = newNode();
      expect(node.toXml({
        indents: 1,
        spacesPerIndent: 4
      })).to.equal('    test');
    });

    it('should capitalize boolean values', function () {
      const trueNode = newNode(true);
      expect(trueNode.toXml()).to.equal('True');
      const falseNode = newNode(false);
      expect(falseNode.toXml()).to.equal('False');
    });

    it('should write numbers and bigints as strings', function () {
      const numberNode = newNode(123);
      expect(numberNode.toXml()).to.equal('123');
      const bigintNode = newNode(123n);
      expect(bigintNode.toXml()).to.equal('123');
    });

    it('should write strings', function () {
      const node = newNode();
      expect(node.toXml()).to.equal('test');
    });
  });
});

describe('TuningCommentNode', function() {
  const newNode = (value = "Comment") => new TuningCommentNode(value);

  describe('#constructor', function() {
    it('should throw when no value is given', function () {
      expect(() => new TuningCommentNode()).to.throw;
    });

    it('should use the value that is given', function () {
      const node = new TuningCommentNode("hello");
      expect(node.value).to.equal("hello");
    });
  });

  describe('#attributes', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.attributes = {}).to.throw;
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.attributes).to.be.undefined;
    });
  });

  describe('#child', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.child = newNode()).to.throw;
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.child).to.be.undefined;
    });
  });

  describe('#children', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.children = []).to.throw;
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.children).to.be.undefined;
    });
  });

  describe('#hasChildren', function() {
    it('should be false', function () {
      const node = newNode();
      expect(node.hasChildren).to.be.false;
    });
  });

  describe('#id', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.id = 123n).to.throw;
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.id).to.be.undefined;
    });
  });

  describe('#innerValue', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.innerValue = 123n).to.throw;
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.innerValue).to.be.undefined;
    });
  });

  describe('#name', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.name = "name").to.throw;
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.name).to.be.undefined;
    });
  });

  describe('#numChildren', function() {
    it('should be 0', function () {
      const node = newNode();
      expect(node.numChildren).to.equal(0);
    });
  });

  describe('#tag', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.tag = "tag").to.throw;
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.tag).to.be.undefined;
    });
  });

  describe('#type', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.type = "enabled").to.throw;
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.type).to.be.undefined;
    });
  });

  describe('#value', function() {
    it('should change the value when set', function () {
      const node = newNode("hello");
      expect(node.value).to.equal("hello");
      node.value = "goodbye";
      expect(node.value).to.equal("goodbye");
    });

    it('should return the current value', function () {
      const node = newNode("hello");
      expect(node.value).to.equal("hello");
    });
  });

  describe('#addChildren()', function() {
    it('should throw when no children are given', function () {
      const node = newNode();
      expect(() => node.addChildren()).to.throw;
    });

    it('should throw when children are given', function () {
      const node = newNode();
      expect(() => node.addChildren(newNode(), newNode())).to.throw;
    });
  });

  describe('#addClones()', function() {
    it('should throw when no children are given', function () {
      const node = newNode();
      expect(() => node.addClones()).to.throw;
    });

    it('should throw when children are given', function () {
      const node = newNode();
      expect(() => node.addClones(newNode(), newNode())).to.throw;
    });
  });

  describe('#clone()', function() {
    it('should return a new node with the same comment as this one', function () {
      const node = newNode();
      expect(node.value).to.equal("Comment");
      const clone = node.clone();
      expect(clone.value).to.equal("Comment");
    });

    it('should not mutate the original', function () {
      const node = newNode();
      const clone = node.clone();
      expect(node.value).to.equal("Comment");
      expect(clone.value).to.equal("Comment");
      clone.value = "Hello World";
      expect(node.value).to.equal("Comment");
      expect(clone.value).to.equal("Hello World");
    });
  });

  describe('#deepSort()', function() {
    it('should throw', function () {
      const node = newNode();
      expect(() => node.deepSort()).to.throw;
    });
  });

  describe('#sort()', function() {
    it('should throw', function () {
      const node = newNode();
      expect(() => node.sort()).to.throw;
    });
  });

  describe('#toXml()', function() {
    it('should not indent if the given number is 0', function () {
      const node = newNode();
      expect(node.toXml()).to.equal('<!--Comment-->');
    });

    it('should use a default indentation of 2 spaces', function () {
      const node = newNode();
      expect(node.toXml({ indents: 1 })).to.equal('  <!--Comment-->');
    });

    it('should use the number of spaces that are provided', function () {
      const node = newNode();
      expect(node.toXml({
        indents: 1,
        spacesPerIndent: 4
      })).to.equal('    <!--Comment-->');
    });

    it('should wrap value in XML comment syntax', function () {
      const node = newNode();
      expect(node.toXml()).to.equal('<!--Comment-->');
    });
  });
});
