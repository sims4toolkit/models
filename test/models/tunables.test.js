const { expect } = require('chai');
const { tunables, hashing, formatting, StringTableResource } = require('../../dst/api');
const { formatStringKey } = formatting;
const { fnv32 } = hashing;
const { I, M, T, E, V, U, L, C, S, getStringNodeFunction } = tunables;

describe('tunables', function() {
  describe('#TunableNode', function() {
    // TunableNode is an abstract class and the only export for it is as a type.
    // This section is just for testing the methods that are implemented in the
    // base class and do not depend on any child values/implementations.

    describe('#tag', function() {
      // getter is tested in initializer functions

      it('should throw when being set', function() {
        const node = T();
        expect(() => node.tag = 'I').to.throw;
      });
    });

    describe('#children', function() {
      // getter is tested in initializer functions

      it('should include a new child after add() is called', function() {
        const node = L();
        expect(node.children).to.be.empty;
        node.add(T());
        expect(node.children).to.have.lengthOf(1);
      });

      it('should not include children after they\'re remove()\'d', function() {
        const child = T();
        const node = L({ children: [ child ] });
        expect(node.children).to.have.lengthOf(1);
        node.remove(child);
        expect(node.children).to.be.empty;
      });

      it('should throw when being set', function() {
        const node = T();
        expect(() => node.children = []).to.throw;
      });
    });

    describe('#child', function() {
      it('should return undefined if there are no children', function() {
        const node = L();
        expect(node.child).to.be.undefined;
      });

      it('should return the first child if there is at least one', function() {
        const node = L({ children: [ T() ] });
        expect(node.child).to.not.be.undefined;
      });

      it('should throw when being set', function() {
        const node = L();
        expect(() => node.child = T()).to.throw;
      });
    });

    describe('#name', function() {
      it('should get the n attribute', function() {
        const node = T({ name: "some_name" });
        expect(node.attributes.n).to.equal("some_name");
        expect(node.name).to.equal("some_name");
      });

      it('should set the n attribute', function() {
        const node = T({ name: "some_name" });
        expect(node.attributes.n).to.equal("some_name");
        node.name = "new_name";
        expect(node.attributes.n).to.equal("new_name");
      });
    });

    describe('#attributes', function() {
      // getter is tested in initializer functions

      it('should allow contents to be updated', function() {
        const node = T({ name: "tunable" });
        expect(node.attributes.n).to.equal("tunable");
        node.attributes.n = "new_name";
        expect(node.attributes.n).to.equal("new_name");
      });

      it('should throw when being set', function() {
        const node = T();
        expect(() => node.attributes = {}).to.throw;
      });
    });

    describe('#value', function() {
      // getter is tested in initializer functions

      it('should return undefined when there is no value', function() {
        const node = T();
        expect(node.value).to.be.undefined;
      });

      it('should update after being set', function() {
        const node = T({ value: 2 });
        expect(node.value).to.equal(2);
        node.value = 4;
        expect(node.value).to.equal(4);
      });
    });

    describe('#comment', function() {
      // getter is tested in initializer functions

      it('should return undefined when there is no comment', function() {
        const node = T();
        expect(node.comment).to.be.undefined;
      });

      it('should update after being set', function() {
        const node = T({ comment: "Comment" });
        expect(node.comment).to.equal("Comment");
        node.comment = "New comment";
        expect(node.comment).to.equal("New comment");
      });
    });

    describe('#add()', function() {
      it('should do nothing when no children are given', function() {
        const node = U();
        expect(node.children).to.be.empty;
        node.add();
        expect(node.children).to.be.empty;
      });

      it('should add a child to the node it is called on', function() {
        const node = U();
        expect(node.children).to.be.empty;
        node.add(T({ name: "tunable", value: "Something" }));
        expect(node.children).to.have.lengthOf(1);
        expect(node.children[0].attributes.n).to.equal("tunable");
        expect(node.children[0].value).to.equal("Something");
      });

      it('should add all children that are given', function() {
        const node = L();
        expect(node.children).to.be.empty;
        node.add(T({ value: "first" }), T({ value: "second" }));
        expect(node.children).to.have.lengthOf(2);
        const [ first, second ] = node.children;
        expect(first.value).to.equal("first");
        expect(second.value).to.equal("second");
      });

      it('should add the child by reference, allowing mutation', function() {
        const child = T();
        const node = L();
        node.add(child);
        expect(node.child.value).to.be.undefined;
        child.value = 25;
        expect(node.child.value).to.equal(25);
      });
    });

    describe('#addClones()', function() {
      it('should do nothing when no children are given', function() {
        const node = U();
        expect(node.children).to.be.empty;
        node.addClones();
        expect(node.children).to.be.empty;
      });

      it('should add a child to the node it is called on', function() {
        const node = U();
        expect(node.children).to.be.empty;
        node.addClones(T({ name: "tunable", value: "Something" }));
        expect(node.children).to.have.lengthOf(1);
        expect(node.children[0].attributes.n).to.equal("tunable");
        expect(node.children[0].value).to.equal("Something");
      });

      it('should add all children that are given', function() {
        const node = L();
        expect(node.children).to.be.empty;
        node.addClones(T({ value: "first" }), T({ value: "second" }));
        const [ first, second ] = node.children;
        expect(first.value).to.equal("first");
        expect(second.value).to.equal("second");
      });

      it('should add the child by value, disallowing mutation', function() {
        const child = T({ value: 25 });
        const node = L();
        node.addClones(child);
        expect(node.child.value).to.equal(25);
        child.value = 50;
        expect(node.child.value).to.equal(25);
      });
    });

    describe('#search()', function() {
      it('should return all children if no criteria were given', function() {
        const node = I({ c: "Class", i: "type", m: "path", n: "name", s: 12345,
          children: [
            T({ name: "tunable", value: 25 }),
            E({ name: "enum", value: "Value" }),
            L({ name: "list", comment: "Intentionally empty" }),
            V({ name: "variant", type: "enabled" })
          ]
        });

        const result = node.search();
        expect(result).to.be.an('Array').with.lengthOf(4);
      });

      it('should filter by tag', function() {
        const node = I({ c: "Class", i: "type", m: "path", n: "name", s: 12345,
          children: [
            T({ name: "tunable_1", value: 25 }),
            E({ name: "enum", value: "Value" }),
            L({ name: "list", comment: "Intentionally empty" }),
            T({ name: "tunable_2", value: 50 }),
            V({ name: "variant", type: "enabled" })
          ]
        });

        const result = node.search({ tag: 'T' });
        expect(result).to.have.lengthOf(2);
        expect(result[0].name).to.equal("tunable_1");
        expect(result[1].name).to.equal("tunable_2");
      });

      it('should filter by name', function() {
        const node = I({ c: "Class", i: "type", m: "path", n: "name", s: 12345,
          children: [
            T({ name: "tunable_1", value: 25 }),
            E({ name: "enum", value: "Value" }),
            L({ name: "list", comment: "Intentionally empty" }),
            T({ name: "tunable_2", value: 50 }),
            V({ name: "variant", type: "enabled" })
          ]
        });

        const result = node.search({ name: 'enum' });
        expect(result).to.have.lengthOf(1);
        expect(result[0].name).to.equal("enum");
      });

      it('should filter by attributes', function() {
        const node = I({ c: "Class", i: "type", m: "path", n: "name", s: 12345,
          children: [
            T({ name: "tunable_1", value: 25 }),
            E({ name: "enum", value: "Value" }),
            V({ name: "variant_1", type: "enabled" }),
            V({ name: "variant_2", type: "disabled" }),
            L({ name: "list", comment: "Intentionally empty" }),
            T({ name: "tunable_2", value: "Value" }),
            V({ name: "variant_3", type: "enabled" })
          ]
        });

        const result = node.search({ attributes: { t: "enabled" } });
        expect(result).to.have.lengthOf(2);
        expect(result[0].name).to.equal("variant_1");
        expect(result[1].name).to.equal("variant_3");
      });

      it('should filter by value', function() {
        const node = I({ c: "Class", i: "type", m: "path", n: "name", s: 12345,
          children: [
            T({ name: "tunable_1", value: 25 }),
            E({ name: "enum", value: "Value" }),
            L({ name: "list", comment: "Intentionally empty" }),
            T({ name: "tunable_2", value: "Value" }),
            V({ name: "variant", type: "enabled" })
          ]
        });

        const result = node.search({ value: 'Value' });
        expect(result).to.have.lengthOf(2);
        expect(result[0].name).to.equal("enum");
        expect(result[1].name).to.equal("tunable_2");
      });

      it('should filter by comment', function() {
        const node = I({ c: "Class", i: "type", m: "path", n: "name", s: 12345,
          children: [
            T({ name: "tunable_1", value: 25 }),
            E({ name: "enum", value: "Value" }),
            L({ name: "list", comment: "Intentionally empty" }),
            T({ name: "tunable_2", value: "Value" }),
            V({ name: "variant", type: "enabled", comment: "Intentionally empty" })
          ]
        });

        const result = node.search({ comment: 'Intentionally empty' });
        expect(result).to.have.lengthOf(2);
        expect(result[0].name).to.equal("list");
        expect(result[1].name).to.equal("variant");
      });

      it('should filter by multiple criteria', function() {
        const node = I({ c: "Class", i: "type", m: "path", n: "name", s: 12345,
          children: [
            T({ name: "tunable_1", value: 25 }),
            E({ name: "enum", value: "Value" }),
            L({ name: "list", comment: "Intentionally empty" }),
            T({ name: "tunable_2", value: "Value" }),
            V({ name: "variant", type: "enabled", comment: "Intentionally empty" })
          ]
        });

        const result = node.search({ tag: 'V', comment: 'Intentionally empty' });
        expect(result).to.have.lengthOf(1);
        expect(result[0].name).to.equal("variant");
      });

      it('should return an empty list when nothing matches', function() {
        const node = I({ c: "Class", i: "type", m: "path", n: "name", s: 12345,
          children: [
            T({ name: "tunable_1", value: 25 }),
            E({ name: "enum", value: "Value" }),
            L({ name: "list", comment: "Intentionally empty" }),
            T({ name: "tunable_2", value: "Value" }),
            V({ name: "variant", type: "enabled", comment: "Intentionally empty" })
          ]
        });

        const result = node.search({ name: "doesnt_exist" });
        expect(result).to.be.empty;
      });
    });

    describe('#sort()', function() {
      it('should sort in alphabetical order by name if no fn passed in', function() {
        const node = L({
          children: [
            T({ name: "b" }),
            T({ name: "d" }),
            T({ name: "a" }),
            T({ name: "c" })
          ]
        });

        node.sort();
        expect(node.children[0].name).to.equal('a');
        expect(node.children[1].name).to.equal('b');
        expect(node.children[2].name).to.equal('c');
        expect(node.children[3].name).to.equal('d');
      });

      it('should sort children according to the given function', function() {
        const node = L({
          children: [
            T({ name: "b", value: 1 }),
            T({ name: "d", value: 4 }),
            T({ name: "a", value: 3 }),
            T({ name: "c", value: 2 })
          ]
        });

        node.sort((a, b) => a.value - b.value);
        expect(node.children[0].name).to.equal('b');
        expect(node.children[1].name).to.equal('c');
        expect(node.children[2].name).to.equal('a');
        expect(node.children[3].name).to.equal('d');
      });

      it("should not change the order of childrens' children", function() {
        const node = L({
          children: [
            U({
              children: [
                T({ name: "b" }),
                T({ name: "a" }),
                T({ name: "c" })
              ]
            })
          ]
        });

        node.sort();
        expect(node.child.children[0].name).to.equal("b");
        expect(node.child.children[1].name).to.equal("a");
        expect(node.child.children[2].name).to.equal("c");
      });
    });

    describe('#deepSort()', function() {
      it("should recursively sort children", function() {
        const node = L({
          children: [
            U({
              children: [
                T({ name: "b" }),
                T({ name: "a" }),
                T({ name: "c" })
              ]
            })
          ]
        });

        node.deepSort();
        expect(node.child.children[0].name).to.equal("a");
        expect(node.child.children[1].name).to.equal("b");
        expect(node.child.children[2].name).to.equal("c");
      });
    });

    describe('#remove()', function() {
      it('should do nothing if no child is passed in', function() {
        const node = L({
          children: [
            T({ name: "first" }),
            T({ name: "second" }),
            T({ name: "third" })
          ]
        });

        expect(node.children).to.have.lengthOf(3);
        node.remove();
        expect(node.children).to.have.lengthOf(3);
      });

      it('should remove the one child that is passed in', function() {
        const first = T({ name: "first" });

        const node = L({
          children: [
            first,
            T({ name: "second" }),
            T({ name: "third" })
          ]
        });

        expect(node.children).to.have.lengthOf(3);
        node.remove(first);
        expect(node.children).to.have.lengthOf(2);
        expect(node.children[0].name).to.equal("second");
        expect(node.children[1].name).to.equal("third");
      });

      it('should remove all children that are passed in', function() {
        const first = T({ name: "first" });
        const second = T({ name: "second" });

        const node = L({
          children: [
            first,
            second,
            T({ name: "third" })
          ]
        });

        expect(node.children).to.have.lengthOf(3);
        node.remove(first, second);
        expect(node.children).to.have.lengthOf(1);
        expect(node.children[0].name).to.equal("third");
      });

      it('should ignore children that are not in this node', function() {
        const other = T({ name: "other" });

        const node = L({
          children: [
            T({ name: "first" }),
            T({ name: "second" }),
            T({ name: "third" })
          ]
        });

        expect(node.children).to.have.lengthOf(3);
        node.remove(other);
        expect(node.children).to.have.lengthOf(3);
      });

      it('should remove children by reference, not value', function() {
        const first = T({ name: "first" });
        const second = T({ name: "second" });

        const node = L({
          children: [
            first,
            T({ name: "second" }),
            T({ name: "third" })
          ]
        });

        expect(node.children).to.have.lengthOf(3);
        node.remove(first, second);
        expect(node.children).to.have.lengthOf(2);
        expect(node.children[0].name).to.equal("second");
        expect(node.children[1].name).to.equal("third");
      });
    });

    describe('#toXml()', function() {
      // testing each node type is done with functions

      it('should use 0 indents by default', function() {
        const node = T();
        const xml = node.toXml();
        expect(xml).to.equal(`<T/>`);
      });

      it('should use the given number of indents', function() {
        const node = T();
        const xml = node.toXml({ indents: 1 });
        expect(xml).to.equal(`  <T/>`);
      });

      it('should increase indent by 1 after each recursive call', function() {
        const node = L({ children: [ T() ] });
        const xml = node.toXml();
        expect(xml).to.equal(`<L>\n  <T/>\n</L>`);
      });

      it('should use 2 spaces per indent by default', function() {
        const node = T();
        const xml = node.toXml({ indents: 1 });
        expect(xml).to.equal(`  <T/>`);
      });

      it('should use the given number of spaces per indent', function() {
        const node = T();
        const xml = node.toXml({ indents: 1, spacesPerIndent: 4 });
        expect(xml).to.equal(`    <T/>`);
      });

      it('should include the declaration when told to', function() {
        const node = T();
        const xml = node.toXml({ includeDeclaration: true });
        expect(xml).to.equal(`<?xml version="1.0" encoding="utf-8"?>\n<T/>`);
      });
      
      it('should not alphabetize the children by default', function() {
        const node = L({ children: [ T({ name: "b" }), T({ name: "a" }) ] });
        const xml = node.toXml();
        expect(xml).to.equal(`<L>\n  <T n="b"/>\n  <T n="a"/>\n</L>`);
      });

      it('should alphabetize the children when told to', function() {
        const node = L({ children: [ T({ name: "b" }), T({ name: "a" }) ] });
        const xml = node.toXml({ alphabetize: true });
        expect(xml).to.equal(`<L>\n  <T n="a"/>\n  <T n="b"/>\n</L>`);
      });

      it('should also alphabetize nested children when told to', function() {
        const node = L({ children: [ L({ children: [ T({ name: "b" }), T({ name: "a" }) ] }) ] });
        const xml = node.toXml({ alphabetize: true });
        expect(xml).to.equal(`<L>\n  <L>\n    <T n="a"/>\n    <T n="b"/>\n  </L>\n</L>`);
      });

      it('should alphabetize the attributes when told to', function() {
        const node = I({ n: "name", s: 123, i: "type", c: "Class", m: "path" });
        const xml = node.toXml();
        expect(xml).to.equal(`<I c="Class" i="type" m="path" n="name" s="123"/>`);
      });

      it('should write comment between open and close tags when empty', function() {
        const node = T({ comment: "Comment" });
        const xml = node.toXml();
        expect(xml).to.equal(`<T><!--Comment--></T>`);
      });

      it('should write comment indented and before first child if there are any', function() {
        const node = L({ comment: "Comment", children: [ T() ] });
        const xml = node.toXml();
        expect(xml).to.equal(`<L>\n  <!--Comment-->\n  <T/>\n</L>`);
      });

      it('should write comment after value if there is one', function() {
        const node = T({ value: 50, comment: "Comment" });
        const xml = node.toXml();
        expect(xml).to.equal(`<T>50<!--Comment--></T>`);
      });

      it('should only use one tag when there is no value, children, or comment', function() {
        const node = T();
        const xml = node.toXml();
        expect(xml).to.equal(`<T/>`);
      });
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
        const node = I({ n: "name", c: "class", i: "type", m: "path", s: 12345,
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
        const node = I({ n: "name", c: "class", i: "type", m: "path", s: 123,
          comment: "This is a comment"
        });

        const clone = node.clone();
        clone.comment = "New comment";
        expect(node.comment).to.equal("This is a comment");
        expect(clone.comment).to.equal("New comment");
      });

      it('should not mutate the attributes of the original', function() {
        const node = I({ n: "name", c: "class", i: "type", m: "path", s: 123 });
        const clone = node.clone();
        clone.attributes.n = "new_name";
        expect(node.attributes.n).to.equal("name");
        expect(clone.attributes.n).to.equal("new_name");
      });

      it('should not mutate the children array of the original', function() {
        const node = I({ n: "name", c: "class", i: "type", m: "path", s: 123 });
        expect(node.children).to.be.an('Array').that.is.empty;
        const clone = node.clone();
        expect(clone.children).to.be.an('Array').that.is.empty;
        clone.add(T({ name: "new_child" }));
        expect(node.children).to.be.an('Array').that.is.empty;
        expect(clone.children).to.be.an('Array').with.lengthOf(1);
      });

      it('should not mutate the child nodes of the original', function() {
        const node = I({ n: "name", c: "class", i: "type", m: "path", s: 123,
          children: [ T({ name: "child", value: 10 }) ]
        });

        const clone = node.clone();
        clone.children[0].value = 20;
        expect(node.children[0].value).to.equal(10);
        expect(clone.children[0].value).to.equal(20);
      });
    });

    describe('#toXml()', function() {
      it("should write 'I' and all attributes", function() {
        const node = I({ c: "Class", i: "type", m: "path", n: "name", s: 123 });
        const xml = node.toXml();
        expect(xml).to.equal(`<I c="Class" i="type" m="path" n="name" s="123"/>`);
      });
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
        const node = M({ n: "module.name", s: 12345,
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
        const node = M({ n: "module.name", s: 12345,
          comment: "This is a comment",
          children: [
            C({
              name: "FirstClass",
              children: [
                T({ name: "SOME_CONSTANT", value: 50 }),
                E({ name: "SOME_ENUM", value: "Value" })
              ]
            })
          ]
        });
  
        const clone = node.clone();
        expect(clone.children).to.have.lengthOf(1);
        const cls = clone.children[0];
        expect(cls.children).to.have.lengthOf(2);
        const [t, e] = cls.children;
        expect(t.attributes.n).to.equal("SOME_CONSTANT");
        expect(t.value).to.equal(50);
        expect(e.attributes.n).to.equal("SOME_ENUM");
        expect(e.value).to.equal("Value");
      });

      it('should not mutate the comment of the original', function() {
        const node = M({ n: "name", s: 123, comment: "Comment" });
        const clone = node.clone();
        clone.comment = "New comment";
        expect(node.comment).to.equal("Comment");
        expect(clone.comment).to.equal("New comment");
      });

      it('should not mutate the attributes of the original', function() {
        const node = M({ n: "name", s: 123, comment: "Comment" });
        const clone = node.clone();
        clone.attributes.n = "new.name";
        expect(node.attributes.n).to.equal("name");
        expect(clone.attributes.n).to.equal("new.name");
      });

      it('should not mutate the children array of the original', function() {
        const node = M({ n: "name", s: 123 });
        expect(node.children).to.be.empty;
        const clone = node.clone();
        expect(clone.children).to.be.empty;
        clone.add(C({ name: "Some class" }));
        expect(node.children).to.be.empty;
        expect(clone.children).to.have.lengthOf(1);
      });

      it('should not mutate the child nodes of the original', function() {
        const node = M({ n: "name", s: 123, children: [ C({ name: "Cls" }) ] });
        expect(node.children[0].children).to.be.empty;
        const clone = node.clone();
        expect(clone.children[0].children).to.be.empty;
        clone.children[0].add(T({ name: "CONSTANT", value: 50 }));
        expect(node.children[0].children).to.be.empty;
        expect(clone.children[0].children).to.have.lengthOf(1);
      });
    });

    describe('#toXml()', function() {
      it("should write 'M' and all attributes", function() {
        const node = M({ n: "module.name", s: 1234567890n });
        const xml = node.toXml();
        expect(xml).to.equal(`<M n="module.name" s="1234567890"/>`);
      });
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
      it("should write 'T' and the name attribute", function() {
        const node = T({ name: "tunable" });
        const xml = node.toXml();
        expect(xml).to.equal(`<T n="tunable"/>`);
      });

      it("should write 'T' and the ev attribute", function() {
        const node = T({ ev: 25 });
        const xml = node.toXml();
        expect(xml).to.equal(`<T ev="25"/>`);
      });

      it("should write value of 'true' as 'True'", function() {
        const node = T({ value: true });
        const xml = node.toXml();
        expect(xml).to.equal(`<T>True</T>`);
      });

      it("should write value of 'false' as 'False'", function() {
        const node = T({ value: false });
        const xml = node.toXml();
        expect(xml).to.equal(`<T>False</T>`);
      });

      it("should write numbers as strings", function() {
        const node = T({ value: 12345 });
        const xml = node.toXml();
        expect(xml).to.equal(`<T>12345</T>`);
      });

      it("should write bigints as strings", function() {
        const node = T({ value: 12345n });
        const xml = node.toXml();
        expect(xml).to.equal(`<T>12345</T>`);
      });
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
      it("should write 'E' and its name and value", function() {
        const node = E({ name: "enum", value: "SOMETHING" });
        const xml = node.toXml();
        expect(xml).to.equal(`<E n="enum">SOMETHING</E>`);
      });
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
        const node = V({ name: "variant", type: "enabled",
          child: T({ name: "enabled", value: 50 })
        });

        const clone = node.clone();
        expect(clone.attributes.n).to.equal("variant");
        expect(clone.attributes.t).to.equal("enabled");
        expect(clone.child.attributes.n).to.equal("enabled");
        expect(clone.child.value).to.equal(50);
      });

      it('should copy deeply nested nodes (children of child)', function() {
        const node = V({ name: "variant", type: "enabled",
          child: L({
            name: "enabled",
            children: [ T({ value: 1 }), T({ value: 2 }) ]
          })
        });

        const clone = node.clone();
        expect(clone.child.children).to.be.an('Array').with.lengthOf(2);
        expect(clone.child.children[0].value).to.equal(1);
        expect(clone.child.children[1].value).to.equal(2);
      });

      it('should not mutate the comment of the original', function() {
        const node = V({ type: "disabled", comment: "Comment"});
        const clone = node.clone();
        expect(node.comment).to.equal("Comment");
        expect(clone.comment).to.equal("Comment");
        clone.comment = "New comment";
        expect(node.comment).to.equal("Comment");
        expect(clone.comment).to.equal("New comment");
      });

      it('should not mutate the attributes of the original', function() {
        const node = V({ type: "disabled" });
        const clone = node.clone();
        expect(node.attributes.t).to.equal("disabled");
        expect(clone.attributes.t).to.equal("disabled");
        clone.attributes.t = "enabled";
        expect(node.attributes.t).to.equal("disabled");
        expect(clone.attributes.t).to.equal("enabled");
      });

      it('should not mutate the children array of the original', function() {
        const node = V({ type: "enabled" });
        expect(node.children).to.be.empty;
        const clone = node.clone();
        expect(clone.children).to.be.empty;
        clone.add(T({ name: "enabled", value: 5 }));
        expect(node.children).to.be.empty;
        expect(clone.children).to.have.lengthOf(1);
      });

      it('should not mutate the child node of the original', function() {
        const node = V({ child: T({ value: 10 }) });
        const clone = node.clone();
        clone.child.value = 15;
        expect(node.child.value).to.equal(10);
        expect(clone.child.value).to.equal(15);
      });
    });

    describe('#toXml()', function() {
      it("should write 'V' and all attributes when there is no child", function() {
        const node = V({ name: "variant", type: "disabled" });
        const xml = node.toXml();
        expect(xml).to.equal(`<V n="variant" t="disabled"/>`);
      });

      it("should write 'V' and its child", function() {
        const node = V({ name: "variant", type: "enabled", child: T({ name: "enabled" }) });
        const xml = node.toXml();
        expect(xml).to.equal(`<V n="variant" t="enabled">\n  <T n="enabled"/>\n</V>`);
      });
    });
  });

  describe('#U()', function() {
    it('should create a node with the "U" tag', function() {
      const node = U();
      expect(node.tag).to.equal('U');
    });

    it('should create a node with the given attributes', function() {
      const node = U({ name: "tuple" });
      expect(node.attributes.n).to.equal('tuple');
    });

    it('should create a node with no children if none are given', function() {
      const node = U();
      expect(node.children).to.be.empty;
    });

    it('should create a node with the given children', function() {
      const node = U({ 
        children: [
          T({ name: "first", value: 2 }),
          T({ name: "second", value: 4 })
        ]
      });

      expect(node.children).to.be.an('Array').with.lengthOf(2);
      const [ first, second ] = node.children;
      expect(first.attributes.n).to.equal('first');
      expect(first.value).to.equal(2);
      expect(second.attributes.n).to.equal('second');
      expect(second.value).to.equal(4);
    });

    it('should create a node with the given comment', function() {
      const node = U({ comment: "This is the comment" });
      expect(node.comment).to.equal("This is the comment");
    });

    it('should not have a comment if none is given', function() {
      const node = U();
      expect(node.comment).to.be.undefined;
    });

    describe('#clone()', function() {
      it('should copy all contents of the node', function() {
        const node = U({ name: "tuple",
          comment: "This is a comment",
          children: [
            T({ name: "first", value: 5 })
          ]
        });
  
        const clone = node.clone();
        expect(clone.attributes.n).to.equal("tuple");
        expect(clone.comment).to.equal('This is a comment');
        expect(clone.children).to.be.an('Array').with.lengthOf(1);
        expect(clone.child.attributes.n).to.equal("first");
        expect(clone.child.value).to.equal(5);
      });

      it('should copy deeply nested nodes (children of children)', function() {
        const node = U({ name: "tuple",
          children: [
            L({
              name: "list",
              children: [ T({ value: 25 }), T({ value: 50 }) ]
            })
          ]
        });
  
        const clone = node.clone();
        expect(clone.children).to.have.lengthOf(1);
        const [ t1, t2 ] = clone.child.children;
        expect(t1.value).to.equal(25);
        expect(t2.value).to.equal(50);
      });

      it('should not mutate the comment of the original', function() {
        const node = U({ comment: "Comment" });
        const clone = node.clone();
        clone.comment = "New comment";
        expect(node.comment).to.equal("Comment");
        expect(clone.comment).to.equal("New comment");
      });

      it('should not mutate the attributes of the original', function() {
        const node = U({ name: "name" });
        const clone = node.clone();
        clone.attributes.n = "new_name";
        expect(node.attributes.n).to.equal("name");
        expect(clone.attributes.n).to.equal("new_name");
      });

      it('should not mutate the children array of the original', function() {
        const node = U();
        expect(node.children).to.be.empty;
        const clone = node.clone();
        expect(clone.children).to.be.empty;
        clone.add(T({ value: "hello" }));
        expect(node.children).to.be.empty;
        expect(clone.children).to.have.lengthOf(1);
      });

      it('should not mutate the child nodes of the original', function() {
        const node = U({ children: [ T({ value: 5 }) ] });
        const clone = node.clone();
        clone.child.value = 10;
        expect(node.child.value).to.equal(5);
        expect(clone.child.value).to.equal(10);
      });
    });

    describe('#toXml()', function() {
      it("should write 'U' and all attributes when there are no children", function() {
        const node = U({ name: "tuple" });
        const xml = node.toXml();
        expect(xml).to.equal(`<U n="tuple"/>`);
      });

      it("should write 'U' and its children", function() {
        const node = U({ name: "tuple", children: [ T({ name: "a" }), T({ name: "b" }) ] });
        const xml = node.toXml();
        expect(xml).to.equal(`<U n="tuple">\n  <T n="a"/>\n  <T n="b"/>\n</U>`);
      });
    });
  });

  describe('#L()', function() {
    it('should create a node with the "L" tag', function() {
      const node = L();
      expect(node.tag).to.equal('L');
    });

    it('should create a node with the given attributes', function() {
      const node = L({ name: "list" });
      expect(node.attributes.n).to.equal('list');
    });

    it('should create a node with no children if none are given', function() {
      const node = L();
      expect(node.children).to.be.empty;
    });

    it('should create a node with the given children', function() {
      const node = L({ 
        children: [
          T({ name: "first", value: 2 }),
          T({ name: "second", value: 4 })
        ]
      });

      expect(node.children).to.be.an('Array').with.lengthOf(2);
      const [ first, second ] = node.children;
      expect(first.attributes.n).to.equal('first');
      expect(first.value).to.equal(2);
      expect(second.attributes.n).to.equal('second');
      expect(second.value).to.equal(4);
    });

    it('should create a node with the given comment', function() {
      const node = L({ comment: "This is the comment" });
      expect(node.comment).to.equal("This is the comment");
    });

    it('should not have a comment if none is given', function() {
      const node = L();
      expect(node.comment).to.be.undefined;
    });

    describe('#clone()', function() {
      it('should copy all contents of the node', function() {
        const node = L({ name: "list",
          comment: "This is a comment",
          children: [
            T({ value: 5 })
          ]
        });
  
        const clone = node.clone();
        expect(clone.attributes.n).to.equal("list");
        expect(clone.comment).to.equal('This is a comment');
        expect(clone.children).to.be.an('Array').with.lengthOf(1);
        expect(clone.child.value).to.equal(5);
      });

      it('should copy deeply nested nodes (children of children)', function() {
        const node = L({
          children: [ L({ children: [ T({ value: 25 }), T({ value: 50 }) ] }) ]
        });
  
        const clone = node.clone();
        expect(clone.children).to.have.lengthOf(1);
        const [ t1, t2 ] = clone.child.children;
        expect(t1.value).to.equal(25);
        expect(t2.value).to.equal(50);
      });

      it('should not mutate the comment of the original', function() {
        const node = L({ comment: "Comment" });
        const clone = node.clone();
        clone.comment = "New comment";
        expect(node.comment).to.equal("Comment");
        expect(clone.comment).to.equal("New comment");
      });

      it('should not mutate the attributes of the original', function() {
        const node = L({ name: "name" });
        const clone = node.clone();
        clone.attributes.n = "new_name";
        expect(node.attributes.n).to.equal("name");
        expect(clone.attributes.n).to.equal("new_name");
      });

      it('should not mutate the children array of the original', function() {
        const node = L();
        expect(node.children).to.be.empty;
        const clone = node.clone();
        expect(clone.children).to.be.empty;
        clone.add(T({ value: "hello" }));
        expect(node.children).to.be.empty;
        expect(clone.children).to.have.lengthOf(1);
      });

      it('should not mutate the child nodes of the original', function() {
        const node = L({ children: [ T({ value: 5 }) ] });
        const clone = node.clone();
        clone.child.value = 10;
        expect(node.child.value).to.equal(5);
        expect(clone.child.value).to.equal(10);
      });
    });

    describe('#toXml()', function() {
      it("should write 'L' and all attributes when there are no children", function() {
        const node = L({ name: "list" });
        const xml = node.toXml();
        expect(xml).to.equal(`<L n="list"/>`);
      });

      it("should write 'L' and its children", function() {
        const node = L({ name: "list", children: [ T(), T() ] });
        const xml = node.toXml();
        expect(xml).to.equal(`<L n="list">\n  <T/>\n  <T/>\n</L>`);
      });
    });
  });

  describe('#C()', function() {
    it('should create a node with the "C" tag', function() {
      const node = C({ name: "Cls" });
      expect(node.tag).to.equal('C');
    });

    it('should throw when missing its name value', function() {
      expect(() => C()).to.throw;
    });

    it('should create a node with the given attributes', function() {
      const node = C({ name: "Cls" });
      expect(node.attributes.n).to.equal('Cls');
    });

    it('should create a node with no children if none are given', function() {
      const node = C({ name: "Cls" });
      expect(node.children).to.be.empty;
    });

    it('should create a node with the given children', function() {
      const node = C({
        name: "Cls",
        children: [
          T({ name: "FIRST", value: 2 }),
          T({ name: "SECOND", value: 4 })
        ]
      });

      expect(node.children).to.be.an('Array').with.lengthOf(2);
      const [ first, second ] = node.children;
      expect(first.attributes.n).to.equal('FIRST');
      expect(first.value).to.equal(2);
      expect(second.attributes.n).to.equal('SECOND');
      expect(second.value).to.equal(4);
    });

    it('should create a node with the given comment', function() {
      const node = C({ name: "Cls", comment: "This is the comment" });
      expect(node.comment).to.equal("This is the comment");
    });

    it('should not have a comment if none is given', function() {
      const node = C({ name: "SomeClass" });
      expect(node.comment).to.be.undefined;
    });

    describe('#clone()', function() {
      it('should copy all contents of the node', function() {
        const node = C({ name: "Class",
          comment: "This is a comment",
          children: [
            T({ name: "VALUE", value: 5 })
          ]
        });
  
        const clone = node.clone();
        expect(clone.attributes.n).to.equal("Class");
        expect(clone.comment).to.equal('This is a comment');
        expect(clone.children).to.be.an('Array').with.lengthOf(1);
        expect(clone.child.attributes.n).to.equal("VALUE");
        expect(clone.child.value).to.equal(5);
      });

      it('should copy deeply nested nodes (children of children)', function() {
        const node = C({ name: "Class",
          children: [ L({ children: [ T({ value: 25 }), T({ value: 50 }) ] }) ]
        });
  
        const clone = node.clone();
        expect(clone.children).to.have.lengthOf(1);
        const [ t1, t2 ] = clone.child.children;
        expect(t1.value).to.equal(25);
        expect(t2.value).to.equal(50);
      });

      it('should not mutate the comment of the original', function() {
        const node = C({ name: "Class", comment: "Comment" });
        const clone = node.clone();
        clone.comment = "New comment";
        expect(node.comment).to.equal("Comment");
        expect(clone.comment).to.equal("New comment");
      });

      it('should not mutate the attributes of the original', function() {
        const node = C({ name: "Class" });
        const clone = node.clone();
        clone.attributes.n = "NewClass";
        expect(node.attributes.n).to.equal("Class");
        expect(clone.attributes.n).to.equal("NewClass");
      });

      it('should not mutate the children array of the original', function() {
        const node = C({ name: "Class" });
        expect(node.children).to.be.empty;
        const clone = node.clone();
        expect(clone.children).to.be.empty;
        clone.add(T({ value: "hello" }));
        expect(node.children).to.be.empty;
        expect(clone.children).to.have.lengthOf(1);
      });

      it('should not mutate the child nodes of the original', function() {
        const node = C({ name: "Class", children: [ T({ value: 5 }) ] });
        const clone = node.clone();
        clone.child.value = 10;
        expect(node.child.value).to.equal(5);
        expect(clone.child.value).to.equal(10);
      });
    });

    describe('#toXml()', function() {
      it("should write 'C' and all attributes when there are no children", function() {
        const node = C({ name: "Class" });
        const xml = node.toXml();
        expect(xml).to.equal(`<C n="Class"/>`);
      });

      it("should write 'C' and its children", function() {
        const node = C({ name: "Class", children: [ T({ name: "A" }), T({ name: "B" }) ] });
        const xml = node.toXml();
        expect(xml).to.equal(`<C n="Class">\n  <T n="A"/>\n  <T n="B"/>\n</C>`);
      });
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
    it('should fail -- needs to be implemented', function() {
      expect(true).to.be.false;
    });

    // TODO:
  });
});
