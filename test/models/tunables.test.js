const { expect } = require('chai');
const { tunables, hashing, formatting, StringTableResource } = require('../../dst/api');

const { formatStringKey } = formatting;
const { fnv32 } = hashing;
const { I, M, T, E, V, U, L, C, S, getStringNodeFunction } = tunables;

describe('tunables', function() {
  describe('#TunableNode', function() {
    // TunableNode is an abstract class and the only export for it is as a type.
    // This section is just for testing the methods that are implemented in the
    // base class and do not depend on any child values/implementations. For
    // this reason, clone() and toXml() are both tested with the functions.

    describe('#tag', function() {
      it('should return the tag', function() {
        // TODO:
      });

      it('should throw when being set', function() {
        // TODO:
      });
    });

    describe('#children', function() {
      it('should return the children', function() {
        // TODO:
      });

      it('should include a new child after add() is called', function() {
        // TODO:
      });

      it('should not include children after they\'re remove()\'d', function() {
        // TODO:
      });

      it('should throw when being set', function() {
        // TODO:
      });
    });

    describe('#attributes', function() {
      it('should return the attributes', function() {
        // TODO:
      });

      it('should allow contents to be updated', function() {
        // TODO:
      });

      it('should throw when being set', function() {
        // TODO:
      });
    });

    describe('#value', function() {
      it('should return the value when there is one', function() {
        // TODO:
      });

      it('should return undefined when there is no value', function() {
        // TODO:
      });

      it('should update after being set', function() {
        // TODO:
      });
    });

    describe('#comment', function() {
      it('should return the comment when there is one', function() {
        // TODO:
      });

      it('should return undefined when there is no comment', function() {
        // TODO:
      });

      it('should update after being set', function() {
        // TODO:
      });
    });

    describe('#add()', function() {
      // TODO:
    });

    describe('#addClones()', function() {
      // TODO:
    });

    describe('#search()', function() {
      // TODO:
    });

    describe('#sort()', function() {
      // TODO:
    });

    describe('#deepSort()', function() {
      // TODO:
    });

    describe('#remove()', function() {
      // TODO:
    });

    describe('#removeAt()', function() {
      // TODO:
    });
  });

  describe('#I()', function() {
    it('should create a node with the "I" tag', function() {
      const node = I({ n: "name", c: "class", i: "type", m: "path", s: 12345 });
      expect(node.tag).to.equal('I');
    });

    it('should throw when missing its header values', function() {
      expect(() => I()).to.throw;
    });

    it('should create a node with the given attributes', function() {
      const node = I({ n: "name", c: "class", i: "type", m: "path", s: 12345 });
      expect(node.attributes.n).to.equal('name');
      expect(node.attributes.c).to.equal('class');
      expect(node.attributes.i).to.equal('type');
      expect(node.attributes.m).to.equal('path');
      expect(node.attributes.s).to.equal('12345');
    });

    it('should create a node with no children if none are given', function() {
      const node = I({ n: "name", c: "class", i: "type", m: "path", s: 12345 });
      expect(node.children).to.be.an('Array').that.is.empty;
    });

    it('should create a node with the given children', function() {
      const node = I({ 
        n: "name",
        c: "class",
        i: "type",
        m: "path",
        s: 12345,
        children: [
          T({ name: "first_child", value: 1 }),
          T({ name: "second_child", value: 2 }),
          T({ name: "third_child", value: 3 }),
        ]
      });

      expect(node.children).to.be.an('Array').with.lengthOf(3);
      const firstChild = node.children[0];
      expect(firstChild.attributes.n).to.equal('first_child');
      expect(firstChild.value).to.equal(1);
      const secondChild = node.children[1];
      expect(secondChild.attributes.n).to.equal('second_child');
      expect(secondChild.value).to.equal(2);
      const thirdChild = node.children[2];
      expect(thirdChild.attributes.n).to.equal('third_child');
      expect(thirdChild.value).to.equal(3);
    });

    it('should create a node with the given comment', function() {
      const node = I({ 
        n: "name",
        c: "class",
        i: "type",
        m: "path",
        s: 12345,
        comment: "This is the comment"
      });

      expect(node.comment).to.equal("This is the comment");
    });

    it('should not have a comment if none is given', function() {
      const node = I({ n: "name", c: "class", i: "type", m: "path", s: 12345 });
      expect(node.comment).to.be.undefined;
    });

    describe('#clone()', function() {
      it('should copy all contents of the node', function() {
        const node = I({ 
          n: "name",
          c: "class",
          i: "type",
          m: "path",
          s: 12345,
          comment: "This is a comment",
          children: [
            T({ name: "first_child", value: 1 }),
            T({ name: "second_child", value: 2 }),
            T({ name: "third_child", value: 3 }),
          ]
        });
  
        const clone = node.clone();
        expect(clone.attributes.n).to.equal("name");
        expect(clone.attributes.c).to.equal("class");
        expect(clone.attributes.i).to.equal("type");
        expect(clone.attributes.m).to.equal("path");
        expect(clone.attributes.s).to.equal('12345');
        expect(clone.comment).to.equal('This is a comment');
        expect(clone.children).to.be.an('Array').with.lengthOf(3);
        expect(clone.children[0].attributes.n).to.equal("first_child");
        expect(clone.children[0].value).to.equal(1);
        expect(clone.children[1].attributes.n).to.equal("second_child");
        expect(clone.children[1].value).to.equal(2);
        expect(clone.children[2].attributes.n).to.equal("third_child");
        expect(clone.children[2].value).to.equal(3);
      });

      it('should copy deeply nested nodes (children of children)', function() {
        const node = I({ 
          n: "name",
          c: "class",
          i: "type",
          m: "path",
          s: 12345,
          comment: "This is a comment",
          children: [
            L({
              name: "first_child",
              children: [
                U({
                  children: [
                    T({ name: "tunable_1", value: 6789n }),
                    E({ name: "enum_1", value: "SomeValue" })
                  ]
                }),
                U({
                  children: [
                    T({ name: "tunable_2", value: 2468n }),
                    E({ name: "enum_2", value: "SomeOtherValue" })
                  ]
                })
              ]
            })
          ]
        });
  
        const clone = node.clone();
        expect(clone.children).to.have.lengthOf(1);
        const list = clone.children[0];
        expect(list.children).to.have.lengthOf(2);
        const [firstT, firstE] = list.children[0].children;
        expect(firstT.attributes.n).to.equal("tunable_1");
        expect(firstT.value).to.equal(6789n);
        expect(firstE.attributes.n).to.equal("enum_1");
        expect(firstE.value).to.equal("SomeValue");
        const [secondT, secondE] = list.children[1].children;
        expect(secondT.attributes.n).to.equal("tunable_2");
        expect(secondT.value).to.equal(2468n);
        expect(secondE.attributes.n).to.equal("enum_2");
        expect(secondE.value).to.equal("SomeOtherValue");
      });

      it('should not mutate the comment of the original', function() {
        // TODO:
      });

      it('should not mutate the attributes of the original', function() {
        // TODO:
      });

      it('should not mutate the children array of the original', function() {
        // TODO:
      });

      it('should not mutate the child nodes of the original', function() {
        // TODO:
      });
    });

    describe('#toXml()', function() {
      // TODO:
    });
  });

  describe('#M()', function() {
    it('should create a node with the "M" tag', function() {
      const node = M({ n: "name", s: 12345 });
      expect(node.tag).to.equal('M');
    });

    it('should throw when missing its header values', function() {
      expect(() => M()).to.throw;
    });

    it('should create a node with the given attributes', function() {
      const node = M({ n: "module.name", s: 12345n });
      expect(node.attributes.n).to.equal('module.name');
      expect(node.attributes.s).to.equal('12345');
    });

    it('should create a node with no children if none are given', function() {
      const node = M({ n: "name", s: 12345 });
      expect(node.children).to.be.an('Array').that.is.empty;
    });

    it('should create a node with the given children', function() {
      const node = M({ 
        n: "module.name",
        s: 12345,
        children: [
          C({ name: "FirstClass" }),
          C({ name: "SecondClass" })
        ]
      });

      expect(node.children).to.be.an('Array').with.lengthOf(2);
      const firstChild = node.children[0];
      expect(firstChild.attributes.n).to.equal('FirstClass');
      const secondChild = node.children[1];
      expect(secondChild.attributes.n).to.equal('SecondClass');
    });

    it('should create a node with the given comment', function() {
      const node = M({ n: "name", s: 12345, comment: "This is the comment" });
      expect(node.comment).to.equal("This is the comment");
    });

    it('should not have a comment if none is given', function() {
      const node = M({ n: "name", s: 12345 });
      expect(node.comment).to.be.undefined;
    });

    describe('#clone()', function() {
      it('should copy all contents of the node', function() {
        const node = M({ 
          n: "module.name",
          s: 12345,
          comment: "This is a comment",
          children: [
            C({ name: "FirstClass" }),
            C({ name: "SecondClass" })
          ]
        });
  
        const clone = node.clone();
        expect(clone.attributes.n).to.equal("module.name");
        expect(clone.attributes.s).to.equal('12345');
        expect(clone.comment).to.equal('This is a comment');
        expect(clone.children).to.be.an('Array').with.lengthOf(2);
        expect(clone.children[0].attributes.n).to.equal("FirstClass");
        expect(clone.children[1].attributes.n).to.equal("SecondClass");
      });

      it('should copy deeply nested nodes (children of children)', function() {
        // TODO:
      });

      it('should not mutate the comment of the original', function() {
        // TODO:
      });

      it('should not mutate the attributes of the original', function() {
        // TODO:
      });

      it('should not mutate the children array of the original', function() {
        // TODO:
      });

      it('should not mutate the child nodes of the original', function() {
        // TODO:
      });
    });

    describe('#toXml()', function() {
      // TODO:
    });
  });

  describe('#T()', function() {
    it('should create a node with the "T" tag', function() {
      const node = T();
      expect(node.tag).to.equal('T');
    });

    it('should create a node with the given name', function() {
      const node = T({ name: "tunable_name" });
      expect(node.attributes.n).to.equal("tunable_name");
    });

    it('should create a node with the given ev', function() {
      const node = T({ ev: 15 });
      expect(node.attributes.ev).to.equal('15');
    });

    it('should create a node with the given value', function() {
      const node = T({ value: 12345 });
      expect(node.value).to.equal(12345);
    });

    it('should create a node with the given comment', function() {
      const node = T({ comment: "This is a comment" });
      expect(node.comment).to.equal("This is a comment");
    });

    it('should not have a comment if none is given', function() {
      const node = T();
      expect(node.comment).to.be.undefined;
    });

    describe('#clone()', function() {
      it('should copy all contents of the node', function() {
        const node = T({ 
          name: "tunable_name",
          ev: 15n,
          comment: "This is a comment",
          value: "Enum_Value"
        });
  
        const clone = node.clone();
        expect(clone.attributes.n).to.equal("tunable_name");
        expect(clone.attributes.ev).to.equal("15");
        expect(clone.comment).to.equal('This is a comment');
        expect(clone.value).to.equal("Enum_Value");
      });

      it('should not mutate the value of the original', function() {
        const node = T({ value: 15 });
        const clone = node.clone();
        clone.value = 20;
        expect(node.value).to.equal(15);
        expect(clone.value).to.equal(20);
      });

      it('should not mutate the comment of the original', function() {
        const node = T({ comment: "Some comment" });
        const clone = node.clone();
        clone.comment = "Some other comment";
        expect(node.comment).to.equal("Some comment");
        expect(clone.comment).to.equal("Some other comment");
      });

      it('should not mutate the attributes of the original', function() {
        const node = T({ name: "tunable_name", ev: 20 });
        const clone = node.clone();
        clone.attributes.n = "new_name";
        expect(node.attributes.n).to.equal("tunable_name");
        expect(clone.attributes.n).to.equal("new_name");
        clone.attributes.ev = "50";
        expect(node.attributes.ev).to.equal("20");
        expect(clone.attributes.ev).to.equal("50");
      });
    });

    describe('#toXml()', function() {
      // TODO:
    });
  });

  describe('#E()', function() {
    it('should create a node with the "E" tag', function() {
      const node = E();
      expect(node.tag).to.equal('E');
    });

    it('should create a node with the given name', function() {
      const node = E({ name: "tunable_name" });
      expect(node.attributes.n).to.equal("tunable_name");
    });

    it('should create a node with the given value', function() {
      const node = E({ value: "ADULT" });
      expect(node.value).to.equal("ADULT");
    });

    it('should create a node with the given comment', function() {
      const node = E({ comment: "This is a comment" });
      expect(node.comment).to.equal("This is a comment");
    });

    it('should not have a comment if none is given', function() {
      const node = E();
      expect(node.comment).to.be.undefined;
    });

    describe('#clone()', function() {
      it('should copy all contents of the node', function() {
        const node = E({ 
          name: "enum_name",
          comment: "This is a comment",
          value: "Value"
        });
  
        const clone = node.clone();
        expect(clone.attributes.n).to.equal("enum_name");
        expect(clone.comment).to.equal('This is a comment');
        expect(clone.value).to.equal("Value");
      });

      it('should not mutate the value of the original', function() {
        const node = E({ value: "Value" });
        const clone = node.clone();
        clone.value = "New_Value";
        expect(node.value).to.equal("Value");
        expect(clone.value).to.equal("New_Value");
      });

      it('should not mutate the comment of the original', function() {
        const node = E({ comment: "Some comment" });
        const clone = node.clone();
        clone.comment = "Some other comment";
        expect(node.comment).to.equal("Some comment");
        expect(clone.comment).to.equal("Some other comment");
      });

      it('should not mutate the attributes of the original', function() {
        const node = E({ name: "enum_name" });
        const clone = node.clone();
        clone.attributes.n = "new_name";
        expect(node.attributes.n).to.equal("enum_name");
        expect(clone.attributes.n).to.equal("new_name");
      });
    });

    describe('#toXml()', function() {
      // TODO:
    });
  });

  describe('#V()', function() {
    it('should create a node with the "V" tag', function() {
      const node = V();
      expect(node.tag).to.equal('V');
    });

    it('should create a node with the given name', function() {
      const node = V({ name: "variant_name" });
      expect(node.attributes.n).to.equal("variant_name");
    });

    it('should create a node with the given type', function() {
      const node = V({ type: "enabled" });
      expect(node.attributes.t).to.equal("enabled");
    });

    it('should create a node with no children if none are given', function() {
      const node = V();
      expect(node.children).to.be.an('Array').that.is.empty;
    });

    it('should create a node with one child if a child is given', function() {
      const node = V({
        type: "enabled",
        child: T({ name: "enabled", value: true })
      });

      expect(node.children).to.be.an('Array').with.lengthOf(1);
      const child = node.children[0];
      expect(child.attributes.n).to.equal('enabled');
      expect(child.value).to.be.true;
    });

    it('should create a node with the given comment', function() {
      const node = V({ comment: "Some comment" });
      expect(node.comment).to.equal("Some comment");
    });

    it('should not have a comment if none is given', function() {
      const node = V();
      expect(node.comment).to.be.undefined;
    });

    describe('#clone()', function() {
      it('should copy all contents of the node', function() {
        // const node = I({ 
        //   n: "name",
        //   c: "class",
        //   i: "type",
        //   m: "path",
        //   s: 12345,
        //   comment: "This is a comment",
        //   children: [
        //     T({ name: "first_child", value: 1 }),
        //     T({ name: "second_child", value: 2 }),
        //     T({ name: "third_child", value: 3 }),
        //   ]
        // });
  
        // const clone = node.clone();
        // expect(clone.attributes.n).to.equal("name");
        // expect(clone.attributes.c).to.equal("class");
        // expect(clone.attributes.i).to.equal("type");
        // expect(clone.attributes.m).to.equal("path");
        // expect(clone.attributes.s).to.equal(12345);
        // expect(clone.comment).to.equal('This is a comment');
        // expect(clone.children).to.be.an('Array').with.lengthOf(3);
        // expect(clone.children[0].attributes.n).to.equal("first_child");
        // expect(clone.children[0].value).to.equal(1);
        // expect(clone.children[1].attributes.n).to.equal("second_child");
        // expect(clone.children[1].value).to.equal(2);
        // expect(clone.children[2].attributes.n).to.equal("third_child");
        // expect(clone.children[2].value).to.equal(3);
      });

      it('should copy deeply nested nodes (children of child)', function() {
        // TODO:
      });

      it('should not mutate the comment of the original', function() {
        // TODO:
      });

      it('should not mutate the attributes of the original', function() {
        // TODO:
      });

      it('should not mutate the children array of the original', function() {
        // TODO:
      });

      it('should not mutate the child node of the original', function() {
        // TODO:
      });
    });

    describe('#toXml()', function() {
      // TODO:
    });
  });

  describe('#U()', function() {
    it('should create a node with the "U" tag', function() {
      const node = U();
      expect(node.tag).to.equal('U');
    });

    it('should create a node with the given name', function() {
      // TODO:
    });

    it('should create a node with no children if none are given', function() {
      // TODO:
    });

    it('should create a node with the given children', function() {
      // TODO:
    });

    it('should create a node with the given comment', function() {
      // TODO:
    });

    it('should not have a comment if none is given', function() {
      const node = U();
      expect(node.comment).to.be.undefined;
    });

    describe('#clone()', function() {
      it('should copy all contents of the node', function() {
        // const node = I({ 
        //   n: "name",
        //   c: "class",
        //   i: "type",
        //   m: "path",
        //   s: 12345,
        //   comment: "This is a comment",
        //   children: [
        //     T({ name: "first_child", value: 1 }),
        //     T({ name: "second_child", value: 2 }),
        //     T({ name: "third_child", value: 3 }),
        //   ]
        // });
  
        // const clone = node.clone();
        // expect(clone.attributes.n).to.equal("name");
        // expect(clone.attributes.c).to.equal("class");
        // expect(clone.attributes.i).to.equal("type");
        // expect(clone.attributes.m).to.equal("path");
        // expect(clone.attributes.s).to.equal(12345);
        // expect(clone.comment).to.equal('This is a comment');
        // expect(clone.children).to.be.an('Array').with.lengthOf(3);
        // expect(clone.children[0].attributes.n).to.equal("first_child");
        // expect(clone.children[0].value).to.equal(1);
        // expect(clone.children[1].attributes.n).to.equal("second_child");
        // expect(clone.children[1].value).to.equal(2);
        // expect(clone.children[2].attributes.n).to.equal("third_child");
        // expect(clone.children[2].value).to.equal(3);
      });

      it('should copy deeply nested nodes (children of children)', function() {
        // TODO:
      });

      it('should not mutate the comment of the original', function() {
        // TODO:
      });

      it('should not mutate the attributes of the original', function() {
        // TODO:
      });

      it('should not mutate the children array of the original', function() {
        // TODO:
      });

      it('should not mutate the child nodes of the original', function() {
        // TODO:
      });
    });

    describe('#toXml()', function() {
      // TODO:
    });
  });

  describe('#L()', function() {
    it('should create a node with the "L" tag', function() {
      const node = L();
      expect(node.tag).to.equal('L');
    });

    it('should create a node with the given name', function() {
      // TODO:
    });

    it('should create a node with no children if none are given', function() {
      // TODO:
    });

    it('should create a node with the given children', function() {
      // TODO:
    });

    it('should create a node with the given comment', function() {
      // TODO:
    });

    it('should not have a comment if none is given', function() {
      const node = L();
      expect(node.comment).to.be.undefined;
    });

    describe('#clone()', function() {
      it('should copy all contents of the node', function() {
        // const node = I({ 
        //   n: "name",
        //   c: "class",
        //   i: "type",
        //   m: "path",
        //   s: 12345,
        //   comment: "This is a comment",
        //   children: [
        //     T({ name: "first_child", value: 1 }),
        //     T({ name: "second_child", value: 2 }),
        //     T({ name: "third_child", value: 3 }),
        //   ]
        // });
  
        // const clone = node.clone();
        // expect(clone.attributes.n).to.equal("name");
        // expect(clone.attributes.c).to.equal("class");
        // expect(clone.attributes.i).to.equal("type");
        // expect(clone.attributes.m).to.equal("path");
        // expect(clone.attributes.s).to.equal(12345);
        // expect(clone.comment).to.equal('This is a comment');
        // expect(clone.children).to.be.an('Array').with.lengthOf(3);
        // expect(clone.children[0].attributes.n).to.equal("first_child");
        // expect(clone.children[0].value).to.equal(1);
        // expect(clone.children[1].attributes.n).to.equal("second_child");
        // expect(clone.children[1].value).to.equal(2);
        // expect(clone.children[2].attributes.n).to.equal("third_child");
        // expect(clone.children[2].value).to.equal(3);
      });

      it('should copy deeply nested nodes (children of children)', function() {
        // TODO:
      });

      it('should not mutate the comment of the original', function() {
        // TODO:
      });

      it('should not mutate the attributes of the original', function() {
        // TODO:
      });

      it('should not mutate the children array of the original', function() {
        // TODO:
      });

      it('should not mutate the child nodes of the original', function() {
        // TODO:
      });
    });

    describe('#toXml()', function() {
      // TODO:
    });
  });

  describe('#C()', function() {
    it('should create a node with the "C" tag', function() {
      const node = C({ name: "name_of_node" });
      expect(node.tag).to.equal('C');
    });

    it('should throw when missing its name value', function() {
      expect(() => C()).to.throw;
    });

    it('should create a node with the given name', function() {
      // TODO:
    });

    it('should create a node with no children if none are given', function() {
      // TODO:
    });

    it('should create a node with the given children', function() {
      // TODO:
    });

    it('should create a node with the given comment', function() {
      // TODO:
    });

    it('should not have a comment if none is given', function() {
      const node = C({ name: "SomeClass" });
      expect(node.comment).to.be.undefined;
    });

    describe('#clone()', function() {
      it('should copy all contents of the node', function() {
        // const node = I({ 
        //   n: "name",
        //   c: "class",
        //   i: "type",
        //   m: "path",
        //   s: 12345,
        //   comment: "This is a comment",
        //   children: [
        //     T({ name: "first_child", value: 1 }),
        //     T({ name: "second_child", value: 2 }),
        //     T({ name: "third_child", value: 3 }),
        //   ]
        // });
  
        // const clone = node.clone();
        // expect(clone.attributes.n).to.equal("name");
        // expect(clone.attributes.c).to.equal("class");
        // expect(clone.attributes.i).to.equal("type");
        // expect(clone.attributes.m).to.equal("path");
        // expect(clone.attributes.s).to.equal(12345);
        // expect(clone.comment).to.equal('This is a comment');
        // expect(clone.children).to.be.an('Array').with.lengthOf(3);
        // expect(clone.children[0].attributes.n).to.equal("first_child");
        // expect(clone.children[0].value).to.equal(1);
        // expect(clone.children[1].attributes.n).to.equal("second_child");
        // expect(clone.children[1].value).to.equal(2);
        // expect(clone.children[2].attributes.n).to.equal("third_child");
        // expect(clone.children[2].value).to.equal(3);
      });

      it('should copy deeply nested nodes (children of children)', function() {
        // TODO:
      });

      it('should not mutate the comment of the original', function() {
        // TODO:
      });

      it('should not mutate the attributes of the original', function() {
        // TODO:
      });

      it('should not mutate the children array of the original', function() {
        // TODO:
      });

      it('should not mutate the child nodes of the original', function() {
        // TODO:
      });
    });

    describe('#toXml()', function() {
      // TODO:
    });
  });

  describe('#S()', function() {
    it('should create a node with the "T" tag', function() {
      const stbl = StringTableResource.create();
      const node = S({ string: 'Test', stbl });
      expect(node.tag).to.equal('T');
    });

    it('should add the strings to the string table', function() {
      const stbl = StringTableResource.create();

      L({
        children: [
          S({ string: 'First', stbl }),
          S({ string: 'Second', stbl }),
          S({ string: 'Third', stbl }),
        ]
      });

      expect(stbl).to.have.lengthOf(3);
      expect(stbl.entries[0].string).to.equal('First');
      expect(stbl.entries[1].string).to.equal('Second');
      expect(stbl.entries[2].string).to.equal('Third');
    });

    it('should hash the string if no alternative is given', function() {
      const stbl = StringTableResource.create();
      const string = "Some String";
      S({ string, stbl });
      expect(stbl.entries[0].key).to.equal(fnv32(string));
    });

    it('should hash the toHash argument if given', function() {
      const stbl = StringTableResource.create();
      const string = "Some String";
      const toHash = "Something else to hash";
      S({ string, toHash, stbl });
      expect(stbl.entries[0].key).to.equal(fnv32(toHash));
    });

    it('should return a tunable with a name, value, and comment', function() {
      const stbl = StringTableResource.create();
      const name = "tunable_name";
      const string = "Something";
      const node = S({ name, string, stbl });
      expect(node.attributes.n).to.equal(name);
      const expectedValue = formatStringKey(fnv32(string));
      expect(node.value).to.equal(expectedValue);
      expect(node.comment).to.equal(string);
    });
  });

  describe('#getStringNodeFunction()', function() {
    it('should create a node with the "T" tag', function() {
      const stbl = StringTableResource.create();
      const S = getStringNodeFunction(stbl);
      const node = S({ string: 'Test' });
      expect(node.tag).to.equal('T');
    });

    it('should add the strings to the string table', function() {
      const stbl = StringTableResource.create();
      const S = getStringNodeFunction(stbl);

      L({
        children: [
          S({ string: 'First' }),
          S({ string: 'Second' }),
          S({ string: 'Third' }),
        ]
      });

      expect(stbl).to.have.lengthOf(3);
      expect(stbl.entries[0].string).to.equal('First');
      expect(stbl.entries[1].string).to.equal('Second');
      expect(stbl.entries[2].string).to.equal('Third');
    });

    it('should hash the string if no alternative is given', function() {
      const stbl = StringTableResource.create();
      const S = getStringNodeFunction(stbl);
      const string = "Some String";
      S({ string });
      expect(stbl.entries[0].key).to.equal(fnv32(string));
    });

    it('should hash the toHash argument if given', function() {
      const stbl = StringTableResource.create();
      const S = getStringNodeFunction(stbl);
      const string = "Some String";
      const toHash = "Something else to hash";
      S({ string, toHash });
      expect(stbl.entries[0].key).to.equal(fnv32(toHash));
    });

    it('should return a tunable with a name, value, and comment', function() {
      const stbl = StringTableResource.create();
      const S = getStringNodeFunction(stbl);
      const name = "tunable_name";
      const string = "Something";
      const node = S({ name, string });
      expect(node.attributes.n).to.equal(name);
      const expectedValue = formatStringKey(fnv32(string));
      expect(node.value).to.equal(expectedValue);
      expect(node.comment).to.equal(string);
    });
  });

  describe('#parseNode()', function() {
    // TODO:
  });
});
