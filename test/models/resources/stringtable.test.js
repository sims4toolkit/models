const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;
const { StringTableResource, hashing } = require('../../../dst/api');

//#region Helpers

const cachedBuffers = {};

function getSTBL(filename, options = undefined) {
  if (cachedBuffers[filename] !== undefined) {
    return StringTableResource.from(cachedBuffers[filename], options);
  }

  const filepath = path.resolve(__dirname, `../../data/stbls/${filename}.stbl`);
  const buffer = fs.readFileSync(filepath);
  cachedBuffers[filename] = buffer;
  return StringTableResource.from(buffer, options);
}

function assertEntry(entry, id, key, string) {
  expect(entry.id).to.equal(id);
  expect(entry.key).to.equal(key);
  expect(entry.string).to.equal(string);
}

function expectEntriesToBeSame(entry1, entry2) {
  expect(entry1.key).to.equal(entry2.key);
  expect(entry1.string).to.equal(entry2.string);
}

function expectSameContents(stbl1, stbl2) {
  expect(stbl1).to.have.lengthOf(stbl2.length);
  stbl1.entries.forEach((entry, i) => {
    const other = stbl2.entries[i];
    expect(entry.key).to.equal(other.key);
    expect(entry.string).to.equal(other.string);
  });
}

function expectNoMutationOnAdd(stbl1, stbl2) {
  const originalLength = stbl1.length;
  expect(stbl2).to.have.lengthOf(originalLength);
  stbl2.add(1234, "Test");
  expect(stbl1.length).to.equal(originalLength);
  expect(stbl2.length).to.equal(originalLength + 1);
}

function expectNoMutationOnUpdate(stbl1, stbl2) {
  const originalEntry = stbl1.entries[0];
  const originalKey = originalEntry.key;
  const originalString = originalEntry.string;
  const otherEntry = stbl2.entries[0];
  otherEntry.key = originalKey + 1;
  otherEntry.string = originalString + ".";
  const resultEntry = stbl1.entries[0];
  expect(resultEntry.key).to.equal(originalKey);
  expect(resultEntry.string).to.equal(originalString);
}

function expectNoMutationOnRemove(stbl1, stbl2) {
  const originalLength = stbl1.length;
  expect(stbl2).to.have.lengthOf(originalLength);
  stbl2.entries[0].delete();
  expect(stbl1).to.have.lengthOf(originalLength);
  expect(stbl2).to.have.lengthOf(originalLength - 1);
}

//#endregion Helpers

describe('StringTableResource', function() {
  //#region Properties

  describe('#variant', function() {
    it('should be "STBL" when created', function() {
      const stbl = StringTableResource.create();
      expect(stbl.variant).to.equal("STBL");
    });

    it('should be "STBL" when loaded', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl.variant).to.equal("STBL");
    });
  });

  //#endregion Properties

  //#region Initialization

  describe('#create()', function() {
    it('should create a valid, empty string table', function() {
      const stbl = StringTableResource.create();
      expect(stbl).to.not.be.undefined;
      expect(stbl.length).to.equal(0);
    });

    it('should have hasChanged === true', function() {
      const stbl = StringTableResource.create();
      expect(stbl.hasChanged).to.be.true;
    });

    it('should return a stbl with the given contents', function() {
      const stbl = StringTableResource.create([
        { key: 123, string: "First" },
        { key: 456, string: "Second" },
        { key: 789, string: "Third" },
      ]);

      expect(stbl.getById(0).key).to.equal(123);
      expect(stbl.getById(0).string).to.equal("First");
      expect(stbl.getById(1).key).to.equal(456);
      expect(stbl.getById(1).string).to.equal("Second");
      expect(stbl.getById(2).key).to.equal(789);
      expect(stbl.getById(2).string).to.equal("Third");
    });
  });

  describe('#from()', function() {
    context('file is valid', function() {
      it('should load the contents correctly', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.entries).to.be.an('Array').with.lengthOf(3);
        assertEntry(stbl.entries[0], 0, 0x7E08629A, 'This is a string.');
        assertEntry(stbl.entries[1], 1, 0xF098F4B5, 'This is another string!');
        assertEntry(stbl.entries[2], 2, 0x8D6D117D, 'And this, this is a third.');
      });
  
      it('should load repeated entries uniquely', function() {
        const stbl = getSTBL('RepeatedStrings');
        const entries = stbl.entries;
        expect(entries).to.be.an('Array').with.lengthOf(6);
  
        // 0 & 1 have same key and string
        expect(entries[0].key).to.equal(entries[1].key);
        expect(entries[0].string).to.equal(entries[1].string);
        expect(entries[0].id).to.not.equal(entries[1].id);
  
        // 2 & 3 have same string, but different key
        expect(entries[2].key).to.not.equal(entries[3].key);
        expect(entries[2].string).to.equal(entries[3].string);
        expect(entries[2].id).to.not.equal(entries[3].id);
  
        // 4 & 5 have same key, but different string
        expect(entries[4].key).to.equal(entries[5].key);
        expect(entries[4].string).to.not.equal(entries[5].string);
        expect(entries[4].id).to.not.equal(entries[5].id);
      });

      it('should load stbls with special characters correctly', function() {
        const stbl = getSTBL('SpecialChars');
        const entries = stbl.entries;
        expect(entries).to.be.an('Array').with.lengthOf(4);
        assertEntry(entries[0], 0, 0x7E08629A, 'This is a string.');
        assertEntry(entries[1], 1, 0xF098F4B5, 'This is another string!');
        assertEntry(entries[2], 2, 0x8D6D117D, 'And this, this is a third.');
        assertEntry(entries[3], 3, 0x753A781E, 'Thís iš å strįñg w/ spêçiāl chars.');
      });

      it('should have hasChanged === false', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged).to.be.false;
      });
    });

    context('header is corrupt', function() {
      it('should throw by default', function() {
        expect(() => getSTBL('CorruptHeader')).to.throw("Not a string table.");
      });
  
      it('should not throw when options ignore non-fatal errors', function() {
        expect(() => getSTBL('CorruptHeader', { ignoreErrors: true })).to.not.throw();
      });

      it("should return undefined when options don't throw", function() {
        let stbl;
        function stblWrapper() {
          stbl = getSTBL('CorruptHeader', { dontThrow: true });
        }

        expect(stblWrapper).to.not.throw();
        expect(stbl).to.be.undefined;
      });
    });

    context('file is corrupt', function() {
      it('should throw by default', function() {
        expect(() => getSTBL('Corrupt')).to.throw();
      });

      it('should throw when options ignore non-fatal errors', function() {
        expect(() => getSTBL('Corrupt', { ignoreErrors: true })).to.throw();
      });

      it("should return undefined when options don't throw", function() {
        let stbl;
        function stblWrapper() {
          stbl = getSTBL('Corrupt', { dontThrow: true });
        }

        expect(stblWrapper).to.not.throw();
        expect(stbl).to.be.undefined;
      });
    });
  });

  describe('#clone()', function() {
    context('stbl is empty', function() {
      it('should return an empty stbl', function() {
        const stbl = StringTableResource.create();
        expect(stbl.clone()).to.have.lengthOf(0);
      });

      it('should not mutate the original stbl when adding', function() {
        const stbl = StringTableResource.create();
        const clone = stbl.clone();
        expectNoMutationOnAdd(stbl, clone);
      });
    });

    context('stbl has entries', function() {
      it('should return a stbl with the same entries', function() {
        const stbl = getSTBL('SmallSTBL');
        const stblClone = stbl.clone();
        expectSameContents(stbl, stblClone);
      });

      it('should not mutate the original stbl when adding', function() {
        const stbl = getSTBL('SmallSTBL');
        const clone = stbl.clone();
        expectNoMutationOnAdd(stbl, clone);
      });

      it('should not mutate the original stbl when updating', function() {
        const stbl = getSTBL('SmallSTBL');
        const clone = stbl.clone();
        expectNoMutationOnUpdate(stbl, clone);
      });

      it('should not mutate the original stbl when removing', function() {
        const stbl = getSTBL('SmallSTBL');
        const clone = stbl.clone();
        expectNoMutationOnRemove(stbl, clone);
      });
    });
  });

  describe('#merge()', function() {
    context('merging nothing', function() {
      it('should return an empty stbl', function() {
        const stbl = StringTableResource.merge();
        expect(stbl).to.have.lengthOf(0);
      });
    });

    context('merging one', function() {
      it('should return a copy', function() {
        const smallStbl = getSTBL('SmallSTBL');
        const stbl = StringTableResource.merge(smallStbl);
        expectSameContents(smallStbl, stbl);
      });

      it('should not mutate the original when adding', function() {
        const smallStbl = getSTBL('SmallSTBL');
        const stbl = StringTableResource.merge(smallStbl);
        expectNoMutationOnAdd(smallStbl, stbl);
      });

      it('should not mutate the original when updating', function() {
        const smallStbl = getSTBL('SmallSTBL');
        const stbl = StringTableResource.merge(smallStbl);
        expectNoMutationOnUpdate(smallStbl, stbl);
      });

      it('should not mutate the original when removing', function() {
        const smallStbl = getSTBL('SmallSTBL');
        const stbl = StringTableResource.merge(smallStbl);
        expectNoMutationOnRemove(smallStbl, stbl);
      });
    });

    context('merging two', function() {
      context('both empty', function() {
        it('should return an empty stbl', function() {
          const empty1 = StringTableResource.create();
          const empty2 = StringTableResource.create();
          const merged = StringTableResource.merge(empty1, empty2);
          expect(merged.length).to.equal(0);
        });

        it('should not mutate original on add', function() {
          const empty1 = StringTableResource.create();
          const empty2 = StringTableResource.create();
          const merged = StringTableResource.merge(empty1, empty2);
          expectNoMutationOnAdd(empty1, merged);
        });
      });

      context('one empty, one with entries', function() {
        it('should return a copy of the one with entries', function() {
          const smallSTBL = getSTBL('SmallSTBL');
          const emptySTBL = StringTableResource.create();
          const merged = StringTableResource.merge(smallSTBL, emptySTBL);
          expectSameContents(smallSTBL, merged);
        });

        it('should not mutate original on add', function() {
          const smallSTBL = getSTBL('SmallSTBL');
          const emptySTBL = StringTableResource.create();
          const merged = StringTableResource.merge(smallSTBL, emptySTBL);
          expectNoMutationOnAdd(smallSTBL, merged);
        });

        it('should not mutate original on update', function() {
          const smallSTBL = getSTBL('SmallSTBL');
          const emptySTBL = StringTableResource.create();
          const merged = StringTableResource.merge(smallSTBL, emptySTBL);
          expectNoMutationOnUpdate(smallSTBL, merged);
        });

        it('should not mutate original on remove', function() {
          const smallSTBL = getSTBL('SmallSTBL');
          const emptySTBL = StringTableResource.create();
          const merged = StringTableResource.merge(smallSTBL, emptySTBL);
          expectNoMutationOnRemove(smallSTBL, merged);
        });
      });

      context('both with entries', function() {
        it('should return a new stbl with entries from both', function() {
          const smallSTBL = getSTBL('SmallSTBL');
          const freshSTBL = StringTableResource.create();
          freshSTBL.add(1234, "First");
          freshSTBL.add(5678, "Second");
          const merged = StringTableResource.merge(smallSTBL, freshSTBL);
          expect(merged).to.have.lengthOf(smallSTBL.length + 2);
          smallSTBL.add(1234, "First");
          smallSTBL.add(5678, "Second");
          expectSameContents(smallSTBL, merged);
        });
      });
    });

    context('merging three', function() {
      it('should return new stbl with entries from all three', function() {
        const stbl1 = StringTableResource.create();
        stbl1.add(123, "First");
        const stbl2 = StringTableResource.create();
        stbl2.add(456, "Second");
        const stbl3 = StringTableResource.create();
        stbl3.add(789, "Third");
        const merged = StringTableResource.merge(stbl1, stbl2, stbl3);
        expect(merged).to.have.lengthOf(3);
        expect(merged.entries[0].string).to.equal("First");
        expect(merged.entries[1].string).to.equal("Second");
        expect(merged.entries[2].string).to.equal("Third");
      });
    });
  });

  //#endregion Initialization

  //#region CREATE

  describe('#add()', function() {
    it('should add the entry correctly to a new STBL', function() {
      const stbl = StringTableResource.create();
      expect(stbl).to.have.lengthOf(0);
      const entry = stbl.add(1234, 'New string');
      expect(stbl).to.have.lengthOf(1);
      assertEntry(entry, 0, 1234, 'New string');
    });

    it('should add the entry correctly to an existing STBL', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl).to.have.lengthOf(3);
      const entry = stbl.add(1234, 'New string');
      expect(stbl).to.have.lengthOf(4);
      assertEntry(entry, 3, 1234, 'New string');
    });

    it('should throw if key exceeds 32-bit', function() {
      const stbl = StringTableResource.create();
      expect(stbl).to.have.lengthOf(0);
      expect(() => stbl.add(0x100000000, "Test")).to.throw("Tried to add key that is > 32-bit: 4294967296");
      expect(stbl).to.have.lengthOf(0);
    });

    it('should throw if the given key is already in use', function() {
      const stbl = StringTableResource.create();
      stbl.add(123, "String");
      expect(stbl).to.have.lengthOf(1);
      expect(() => stbl.add(123, "Other string")).to.throw("Tried to add key that already exists: 123");
      expect(stbl).to.have.lengthOf(1);
    });

    it('should not throw when key is in use but option ignores it', function() {
      const stbl = StringTableResource.create();
      stbl.add(123, "String");
      expect(stbl).to.have.lengthOf(1);
      expect(() => stbl.add(123, "Other string", { allowDuplicateKey: true })).to.not.throw();
      expect(stbl).to.have.lengthOf(2);
    });

    it('should use the correct ID on a new STBL', function() {
      const stbl = StringTableResource.create();
      expect(stbl.add(1234, "First").id).to.equal(0);
      expect(stbl.add(5678, "Second").id).to.equal(1);
      expect(stbl.add(2468, "Third").id).to.equal(2);
    });

    it('should use the correct ID on an existing STBL', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl.add(1234, "New string").id).to.equal(3);
      expect(stbl.add(5678, "Newer string").id).to.equal(4);
    });

    it('should return the entry that was added', function() {
      const stbl = getSTBL('SmallSTBL');
      const entry = stbl.add(1234, "New string");
      expect(entry).to.not.be.undefined;
      assertEntry(entry, 3, 1234, "New string");
    });

    it('should not recycle IDs after removing an entry', function() {
      const stbl = getSTBL('SmallSTBL');
      const entry = stbl.entries[2];
      expect(entry.id).to.equal(2);
      entry.delete();
      expect(stbl.add(5678, "Another string").id).to.equal(3);
    });

    it('should uncache the buffer if successful', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl.hasChanged).to.be.false;
      stbl.add(123, "Test");
      expect(stbl.hasChanged).to.be.true;
    });

    it('should not uncache the buffer if failed', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl.hasChanged).to.be.false;
      expect(() => stbl.add(0x100000000, "Test")).to.throw();
      expect(stbl.hasChanged).to.be.false;
    });

    it("should add the entry correctly when it has non-latin text", function() {
      const stbl = StringTableResource.create();
      stbl.add(123, "Héllö wørłd!");
      stbl.add(456, "日本語"); // japanese
      stbl.add(789, "繁體中文"); // chinese
      stbl.add(246, "Русский"); // russian
      stbl.add(135, "한국어"); // korean
      expect(stbl).to.have.lengthOf(5);
      expect(stbl.entries[0].string).to.equal("Héllö wørłd!");
      expect(stbl.entries[1].string).to.equal("日本語");
      expect(stbl.entries[2].string).to.equal("繁體中文");
      expect(stbl.entries[3].string).to.equal("Русский");
      expect(stbl.entries[4].string).to.equal("한국어");
    });
  });

  describe('#addAndHash()', function() {
    it("should add the entry correctly when it has non-latin text", function() {
      const stbl = StringTableResource.create();
      expect(stbl).to.have.lengthOf(0);
      expect(stbl.addAndHash("Héllö wørłd!").string).to.equal("Héllö wørłd!");
      expect(stbl.addAndHash("日本語").string).to.equal("日本語");
      expect(stbl.addAndHash("繁體中文").string).to.equal("繁體中文");
      expect(stbl.addAndHash("Русский").string).to.equal("Русский");
      expect(stbl.addAndHash("한국어").string).to.equal("한국어");
      expect(stbl).to.have.lengthOf(5);
    });

    it("should add one entry with the name's 32-bit hash if name given", function() {
      const stbl = StringTableResource.create();
      const string = "This is the string";
      const name = "frankk_TEST:string_Name";
      const entry = stbl.addAndHash(string, { toHash: name });
      expect(stbl).to.have.lengthOf(1);
      expect(entry.key).to.equal(hashing.fnv32(name));
      expect(entry.string).to.equal(string);
    });

    it("should add the entry with the string's hash if no name given", function() {
      const stbl = StringTableResource.create();
      const string = "This is the string";
      stbl.addAndHash(string);
      expect(stbl).to.have.lengthOf(1);
      const entry = stbl.entries[0];
      expect(entry.key).to.equal(hashing.fnv32(string));
      expect(entry.string).to.equal(string);
    });

    it('should uncache the buffer', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl.hasChanged).to.be.false;
      stbl.addAndHash("Hello");
      expect(stbl.hasChanged).to.be.true;
    });

    it('should throw after adding a string with a duplicate hash', function() {
      const stbl = StringTableResource.create();
      stbl.addAndHash("Hi");
      expect(() => stbl.addAndHash("Hi")).to.throw();
    }); 

    it('should not throw for a duplicate hash if told to ignore it', function() {
      const stbl = StringTableResource.create();
      stbl.addAndHash("Hi");
      expect(() => stbl.addAndHash("Hi", { allowDuplicateKey: true })).to.not.throw();
    }); 
  });

  describe('#combine()', function() {
    context('original is empty', function() {
      context('adding empty stbl', function() {
        it('should still be empty', function() {
          const stbl = StringTableResource.create();
          const empty = StringTableResource.create();
          stbl.combine(empty);
          expect(stbl).to.have.lengthOf(0);
        });
      });
  
      context('adding stbl with entries', function() {
        it('should contain the same entries as the given one', function() {
          const empty = StringTableResource.create();
          const withEntries = getSTBL('SmallSTBL');
          empty.combine(withEntries);
          expect(empty.length).to.not.equal(0);
          expectSameContents(empty, withEntries);
        });

        it('should not mutate the given one on add', function() {
          const empty = StringTableResource.create();
          const withEntries = getSTBL('SmallSTBL');
          empty.combine(withEntries);
          expectNoMutationOnAdd(empty, withEntries);
        });

        it('should not mutate the given one on update', function() {
          const empty = StringTableResource.create();
          const withEntries = getSTBL('SmallSTBL');
          empty.combine(withEntries);
          expectNoMutationOnUpdate(empty, withEntries);
        });

        it('should not mutate the given one on remove', function() {
          const empty = StringTableResource.create();
          const withEntries = getSTBL('SmallSTBL');
          empty.combine(withEntries);
          expectNoMutationOnRemove(empty, withEntries);
        });
      });

      context('adding multiple stbls with entries', function() {
        it('should contain the same entries as the given ones', function() {
          const empty = StringTableResource.create();
          const stbl1 = getSTBL('SmallSTBL');
          const stbl2 = StringTableResource.create();
          stbl2.add(1234, "Test");
          empty.combine(stbl1, stbl2);
          const merged = StringTableResource.merge(stbl1, stbl2);
          expectSameContents(empty, merged);
        });
      });
    });

    context('original has entries', function() {
      context('adding empty stbl', function() {
        it('should stay exactly the same', function() {
          const smallStbl = getSTBL('SmallSTBL');
          const clone = smallStbl.clone();
          const empty = StringTableResource.create();
          smallStbl.combine(empty);
          expectSameContents(smallStbl, clone);
        });

        it('should not uncache the buffer', function() {
          const smallStbl = getSTBL('SmallSTBL');
          const empty = StringTableResource.create();
          expect(smallStbl.hasChanged).to.be.false;
          smallStbl.combine(empty);
          expect(smallStbl.hasChanged).to.be.false;
        });
      });
  
      context('adding stbl with entries', function() {
        it('should add the entries from the given one', function() {
          const smallStbl = getSTBL('SmallSTBL');
          const originalEntries = smallStbl.length;
          const other = StringTableResource.create();
          other.add(1234, "Test");
          other.add(5678, "Test 2");
          const merged = StringTableResource.merge(smallStbl, other);
          smallStbl.combine(other);
          expect(smallStbl).to.have.lengthOf(originalEntries + 2);
          expectSameContents(smallStbl, merged);
        });

        it('should uncache the buffer', function() {
          const smallStbl = getSTBL('SmallSTBL');
          expect(smallStbl.hasChanged).to.be.false;
          const other = StringTableResource.create();
          other.add(1234, "Test");
          other.add(5678, "Test 2");
          smallStbl.combine(other);
          expect(smallStbl.hasChanged).to.be.true;
        });
      });

      context('adding multiple stbls with entries', function() {
        it('should add all entries from all given ones', function() {
          const smallStbl = getSTBL('SmallSTBL');

          const other1 = StringTableResource.create();
          other1.add(1234, "Test 1");
          other1.add(5678, "Test 2");

          const other2 = StringTableResource.create();
          other2.add(2468, "Test 3");
          other2.add(1357, "Test 4");

          const merged = StringTableResource.merge(smallStbl, other1, other2);
          smallStbl.combine(other1, other2);

          expectSameContents(smallStbl, merged);
        });

        it('should uncache the buffer', function() {
          const smallStbl = getSTBL('SmallSTBL');
          expect(smallStbl.hasChanged).to.be.false;

          const other1 = StringTableResource.create();
          other1.add(1234, "Test 1");
          other1.add(5678, "Test 2");

          const other2 = StringTableResource.create();
          other2.add(2468, "Test 3");
          other2.add(1357, "Test 4");

          smallStbl.combine(other1, other2);

          expect(smallStbl.hasChanged).to.be.true;
        });
      });
    });
  });

  //#endregion CREATE

  //#region READ

  describe('#entries', function() {
    it('should return the entries of a non-empty STBL', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl.entries).to.be.an('Array').that.has.lengthOf(3);
    });

    it('should return an empty array for an empty STBL', function() {
      const stbl = StringTableResource.create();
      expect(stbl.entries).to.be.an('Array').that.is.empty;
    });

    it('should include new item after adding', function() {
      const stbl = StringTableResource.create();
      expect(stbl.entries[0]).to.be.undefined;
      stbl.addAndHash("Hello");
      expect(stbl.entries[0].string).to.equal("Hello");
    });

    it("should not include an item after it's removed", function() {
      const stbl = getSTBL('SmallSTBL');
      const entry = stbl.getById(0);
      expect(entry).to.not.be.undefined;
      entry.delete();
      expect(stbl.getById(0)).to.be.undefined;
    });

    it('should contain an updated item after updating', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl.entries[1].key).to.not.equal(123);
      stbl.entries[1].key = 123;
      expect(stbl.entries[1].key).to.equal(123);
    });

    it('should not be assignable', function() {
      expect(() => stbl.entries = []).to.throw();
    });
  });

  describe('#findErrors()', function() {
    context('stbl has no errors', function() {
      it('should return an empty array', function() {
        const stbl = getSTBL('SmallSTBL');
        const errors = stbl.findErrors();
        expect(errors).to.be.an('Array');
        expect(errors).to.be.empty;
      });
    });

    context('stbl has one error', function() {
      it('should return "Duplicate Keys" error', function() {
        const stbl = StringTableResource.create();
        stbl.add(1234, "String 1");
        stbl.add(1234, "String 2", { allowDuplicateKey: true });
        const errors = stbl.findErrors();
        expect(errors).to.be.an('Array');
        expect(errors).to.have.lengthOf(1);
        const errorObj = errors[0];
        expect(errorObj.error).to.equal('Duplicate Keys');
        expect(errorObj.entries).to.have.lengthOf(2);
        expect(errorObj.entries[0].string).to.equal("String 1");
        expect(errorObj.entries[1].string).to.equal("String 2");
      });

      it('should return "Duplicate Strings" error', function() {
        const stbl = StringTableResource.create();
        stbl.add(1234, "String 1");
        stbl.add(5678, "String 1");
        const errors = stbl.findErrors();
        expect(errors).to.be.an('Array');
        expect(errors).to.have.lengthOf(1);
        const errorObj = errors[0];
        expect(errorObj.error).to.equal('Duplicate Strings');
        expect(errorObj.entries).to.have.lengthOf(2);
        expect(errorObj.entries[0].key).to.equal(1234);
        expect(errorObj.entries[1].key).to.equal(5678);
      });

      it('should return "Empty String" error', function() {
        const stbl = StringTableResource.create();
        stbl.add(1234, "String");
        stbl.add(5678, "");
        const errors = stbl.findErrors();
        expect(errors).to.be.an('Array');
        expect(errors).to.have.lengthOf(1);
        const errorObj = errors[0];
        expect(errorObj.error).to.equal('Empty String');
        expect(errorObj.entries).to.have.lengthOf(1);
        expect(errorObj.entries[0].key).to.equal(5678);
      });
    });

    context('stbl has multiple errors', function() {
      it('should return all errors', function() {
        const stbl = StringTableResource.create();
        stbl.add(123, "String 1");
        stbl.add(123, "String 2", { allowDuplicateKey: true });
        stbl.add(456, "String 2");
        stbl.add(789, "");
        const errors = stbl.findErrors();
        expect(errors).to.be.an('Array');
        expect(errors).to.have.lengthOf(3);
        const dupKeyErr = errors.find(e => e.error === 'Duplicate Keys');
        expect(dupKeyErr.entries[0].string).to.equal("String 1");
        expect(dupKeyErr.entries[1].string).to.equal("String 2");
        const dupStrErr = errors.find(e => e.error === 'Duplicate Strings');
        expect(dupStrErr.entries[0].key).to.equal(123);
        expect(dupStrErr.entries[1].key).to.equal(456);
        const empStrErr = errors.find(e => e.error === 'Empty String');
        expect(empStrErr.entries[0].key).to.equal(789);
      });
    });
  });

  describe('#findIndex()', function() {
    it('should return the correct index of an entry that exists', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl.findIndex(stbl.entries[0])).to.equal(0);
      expect(stbl.findIndex(stbl.entries[1])).to.equal(1);
      expect(stbl.findIndex(stbl.entries[2])).to.equal(2);
    });

    it('should return -1 if an entry doesn\'t exist', function() {
      const stbl = getSTBL('SmallSTBL');
      const clone = stbl.clone();
      const entry = clone.addAndHash("Hi");
      expect(stbl.findIndex(entry)).to.equal(-1);
    });
  });

  describe('#getById()', function() {
    it('should return the correct entry', function() {
      const stbl = StringTableResource.create();
      stbl.add(123, "First");
      stbl.add(456, "Second");
      const first = stbl.getById(0);
      const second = stbl.getById(1);
      expect(first.key).to.equal(123);
      expect(second.key).to.equal(456);
    });

    it("should return undefined when the id doesn't exist", function() {
      const stbl = getSTBL('SmallSTBL');
      const entry = stbl.getById(3);
      expect(entry).to.be.undefined;
    });

    it('should return undefined when there was an entry with this id, but it was removed', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl.getById(0)).to.not.be.undefined;
      stbl.getById(0).delete();
      expect(stbl.getById(0)).to.be.undefined;
    });
  });

  describe('#getByKey()', function() {
    it('should return the correct entry', function() {
      const stbl = StringTableResource.create();
      stbl.add(123, "First");
      stbl.add(456, "Second");
      const first = stbl.getByKey(123);
      const second = stbl.getByKey(456);
      expect(first.string).to.equal("First");
      expect(second.string).to.equal("Second");
    });

    it('should return the first entry if there is more than one with this key', function() {
      const stbl = StringTableResource.create();
      stbl.add(123, "First");
      stbl.add(123, "Second", { allowDuplicateKey: true });
      const entry = stbl.getByKey(123);
      expect(entry.string).to.equal("First");
    });

    it("should return undefined when the key doesn't exist", function() {
      const stbl = StringTableResource.create();
      stbl.add(123, "First");
      stbl.add(456, "Second");
      const entry = stbl.getByKey(789);
      expect(entry).to.be.undefined;
    });

    it('should return undefined when there was an entry with this key, but it was removed', function() {
      const stbl = StringTableResource.create();
      stbl.add(123, "First");
      stbl.add(456, "Second");
      expect(stbl.getByKey(123)).to.not.be.undefined;
      stbl.getByKey(123).delete();
      expect(stbl.getByKey(123)).to.be.undefined;
    });
  });

  describe('#length', function() {
    context('empty STBL', function() {
      it('should be 0', function() {
        const stbl = StringTableResource.create();
        expect(stbl).to.have.lengthOf(0);
      });

      it('should increase by 1 after adding an entry', function() {
        const stbl = StringTableResource.create();
        expect(stbl).to.have.lengthOf(0);
        stbl.add(1234, 'New string');
        expect(stbl).to.have.lengthOf(1);
      });
    });

    context('existing STBL with 3 entries', function() {
      it('should be 3', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl).to.have.lengthOf(3);
      });

      it('should increase by 1 after adding an entry', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl).to.have.lengthOf(3);
        stbl.add(1234, 'New string');
        expect(stbl).to.have.lengthOf(4);
      });
  
      it('should decrease by 1 after removing an entry', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl).to.have.lengthOf(3);
        stbl.entries[0].delete();
        expect(stbl).to.have.lengthOf(2);
      });
    });
  });

  describe('#search()', function() {
    context('no options are passed', function() {
      it('should return all exact matches in same case', function() {
        const stbl = StringTableResource.create();
        stbl.add(12, 'String');
        stbl.add(34, 'string');
        stbl.add(56, 'String');
        stbl.add(78, 'sTRING');
        const result1 = stbl.search('String');
        expect(result1).to.be.an('Array').with.lengthOf(2);
        expect(result1[0].key).to.equal(12);
        expect(result1[1].key).to.equal(56);
        const result2 = stbl.search('sTRING');
        expect(result2).to.be.an('Array').with.lengthOf(1);
        expect(result2[0].key).to.equal(78);
      });

      it('should return empty array when there are exact matches in different case', function() {
        const stbl = StringTableResource.create();
        stbl.add(34, 'string');
        stbl.add(78, 'sTRING');
        const result = stbl.search('String');
        expect(result).to.be.an('Array').and.to.be.empty;
      });

      it('should return empty array on empty stbl', function() {
        const stbl = StringTableResource.create();
        const result = stbl.search("test");
        expect(result).to.be.an('Array').and.to.be.empty;
      });
    });

    context('case sensitive set to false', function() {
      it('should return empty array when there are no case-insentive exact matches', function() {
        const stbl = getSTBL('SmallSTBL');
        const result = stbl.search('this is another string', { caseSensitive: false });
        expect(result).to.be.an('Array').and.to.be.empty;
      });

      it('should return array with one case-insentive exact match when there is one', function() {
        const stbl = getSTBL('SmallSTBL');
        const result1 = stbl.search('This is another string!', { caseSensitive: false });
        expect(result1).to.be.an('Array').with.lengthOf(1);
        expect(result1[0].key).to.equal(0xF098F4B5);
        const result2 = stbl.search('this is Another string!', { caseSensitive: false });
        expect(result2).to.be.an('Array').with.lengthOf(1);
        expect(result2[0].key).to.equal(0xF098F4B5);
        expect(result2[0].string).to.equal('This is another string!');
      });

      it('should return array of all case-insentive exact matches when there is more than one', function() {
        const stbl = getSTBL('SmallSTBL');
        stbl.addAndHash('tHiS iS aNoThEr StRiNg!')
        const result = stbl.search('this is another string!', { caseSensitive: false });
        expect(result).to.be.an('Array').with.lengthOf(2);
        expect(result[0].key).to.equal(0xF098F4B5);
        expect(result[1].key).to.equal(hashing.fnv32('tHiS iS aNoThEr StRiNg!'));
      });
    });

    context('search for substrings', function() {
      it('should return empty array when none contain the substring', function() {
        const stbl = StringTableResource.create();
        stbl.add(12, 'Hello');
        stbl.add(34, 'Hello world');
        const result = stbl.search('foo', { includeSubstrings: true });
        expect(result).to.be.an('Array').that.is.empty;
      });

      it('should return all entries that contain the substring in same case', function() {
        const stbl = StringTableResource.create();
        stbl.add(12, 'Hello');
        stbl.add(34, 'Hello world');
        const result = stbl.search('Hello', { includeSubstrings: true });
        expect(result).to.be.an('Array').that.has.lengthOf(2);
      });

      it('should return empty array when contains substring, but not in right case', function() {
        const stbl = StringTableResource.create();
        stbl.add(12, 'Hello');
        stbl.add(34, 'Hello world');
        const result = stbl.search('hello', { includeSubstrings: true });
        expect(result).to.be.an('Array').that.is.empty;
      });

      it('should return all entries that contain substring in right case', function() {
        const stbl = StringTableResource.create();
        stbl.add(12, 'Hello');
        stbl.add(34, 'Hello world');
        stbl.add(56, 'hello world');
        const result = stbl.search('Hello', { includeSubstrings: true });
        expect(result).to.be.an('Array').that.has.lengthOf(2);
      });
    });

    context('case sensitive set to false & search for substrings', function() {
      it('should return all entries that contain the substring in different case', function() {
        const stbl = StringTableResource.create();
        stbl.add(12, 'Hello');
        stbl.add(34, 'Hello world');
        const result = stbl.search('hello', { includeSubstrings: true, caseSensitive: false });
        expect(result).to.be.an('Array').that.has.lengthOf(2);
      });
    });
  });

  describe('#StringEntry.key', function() {
    it('should return the correct key for an entry', function() {
      const stbl = StringTableResource.create();
      const entry = stbl.add(123, "Hi");
      expect(entry.key).to.equal(123);
    });

    it('should return the new string for an entry after being updated', function() {
      const stbl = StringTableResource.create();
      const entry = stbl.add(123, "Hi");
      entry.key = 321;
      expect(entry.key).to.equal(321);
    });
  });

  describe('#StringEntry.string', function() {
    it('should return the correct string for an entry', function() {
      const stbl = StringTableResource.create();
      const entry = stbl.add(123, "Hi");
      expect(entry.string).to.equal("Hi");
    });

    it('should return the new string for an entry after being updated', function() {
      const stbl = StringTableResource.create();
      const entry = stbl.add(123, "Hi");
      entry.string = "Bye";
      expect(entry.string).to.equal("Bye");
    });
  });

  //#endregion READ

  //#region UPDATE

  describe('#sort()', function() {
    it('should sort the stbl in alphabetical order when no function given', function() {
      const stbl = StringTableResource.create();
      stbl.addAndHash("b");
      stbl.addAndHash("c");
      stbl.addAndHash("a");
      stbl.addAndHash("d");
      stbl.sort();
      expect(stbl.entries[0].string).to.equal("a");
      expect(stbl.entries[1].string).to.equal("b");
      expect(stbl.entries[2].string).to.equal("c");
      expect(stbl.entries[3].string).to.equal("d");
    });

    it('should sort according to the given function', function() {
      const stbl = StringTableResource.create();
      stbl.add(3, "b");
      stbl.add(1, "c");
      stbl.add(2, "a");
      stbl.add(0, "d");
      stbl.sort((a, b) => a.key - b.key);
      expect(stbl.entries[0].string).to.equal("d");
      expect(stbl.entries[1].string).to.equal("c");
      expect(stbl.entries[2].string).to.equal("a");
      expect(stbl.entries[3].string).to.equal("b");
    });

    it('should uncache the buffer', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl.hasChanged).to.be.false;
      stbl.sort();
      expect(stbl.hasChanged).to.be.true;
    });
  });

  describe('#StringEntry.key', function() {
    it('should change the key value', function() {
      const stbl = StringTableResource.create();
      const entry = stbl.add(123, "Hi");
      entry.key = 321;
      expect(entry.key).to.equal(321);
    });

    it('should uncache the buffer', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl.hasChanged).to.be.false;
      stbl.entries[0].key = 123;
      expect(stbl.hasChanged).to.be.true;
    });
  });

  describe('#StringEntry.string', function() {
    it('should change the string value', function() {
      const stbl = StringTableResource.create();
      const entry = stbl.add(123, "Hi");
      entry.string = "Bye";
      expect(entry.string).to.equal("Bye");
    });

    it('should uncache the buffer', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl.hasChanged).to.be.false;
      stbl.entries[0].string = "Hello";
      expect(stbl.hasChanged).to.be.true;
    });
  });

  //#endregion UPDATE

  //#region DELETE

  describe('#remove()', function() {
    it('should not remove anything when nothing is given', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl).to.have.lengthOf(3);
      stbl.remove();
      expect(stbl).to.have.lengthOf(3);
    });

    it('should remove the one entry that is given', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl.getById(1)).to.not.be.undefined;
      expect(stbl).to.have.lengthOf(3);
      stbl.remove(stbl.getById(1));
      expect(stbl.getById(1)).to.be.undefined;
      expect(stbl).to.have.lengthOf(2);
    });

    it('should remove all entries that are given', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl.getById(0)).to.not.be.undefined;
      expect(stbl.getById(1)).to.not.be.undefined;
      expect(stbl).to.have.lengthOf(3);
      stbl.remove(stbl.getById(0), stbl.getById(1));
      expect(stbl.getById(0)).to.be.undefined;
      expect(stbl.getById(1)).to.be.undefined;
      expect(stbl).to.have.lengthOf(1);
    });

    it('should remove everything if all entries are passed', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl).to.not.be.empty;
      stbl.remove(...stbl.entries);
      expect(stbl).to.have.lengthOf(0);
    });

    it('should not remove anything if given an entry with an unknown ID', function() {
      const stbl = getSTBL('SmallSTBL');
      const clone = stbl.clone();
      const entry = clone.addAndHash("Hi");
      expect(stbl).to.have.lengthOf(3);
      stbl.remove(entry);
      expect(stbl).to.have.lengthOf(3);
    });

    it('should uncache the buffer if successful', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl.hasChanged).to.be.false;
      stbl.remove(stbl.entries[0]);
      expect(stbl.hasChanged).to.be.true;
    });

    it('should not uncache the buffer if failed', function() {
      const stbl = getSTBL('SmallSTBL');
      const clone = stbl.clone();
      const entry = clone.addAndHash("Hi");
      expect(stbl.hasChanged).to.be.false;
      stbl.remove(entry);
      expect(stbl.hasChanged).to.be.false;
    });
  });

  describe('#StringEntry.delete()', function() {
    it('should remove the entry from the stbl', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl.getById(1)).to.not.be.undefined;
      expect(stbl).to.have.lengthOf(3);
      stbl.getById(1).delete();
      expect(stbl.getById(1)).to.be.undefined;
      expect(stbl).to.have.lengthOf(2);
    });

    it('should uncache the buffer', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl.hasChanged).to.be.false;
      stbl.entries[0].delete();
      expect(stbl.hasChanged).to.be.true;
    });

    it('should have no effect on a cloned table', function() {
      const stbl = getSTBL('SmallSTBL');
      const clone = stbl.clone();
      expect(stbl.getById(0)).to.not.be.undefined;
      expect(clone.getById(0)).to.not.be.undefined;
      stbl.getById(0).delete();
      expect(stbl.getById(0)).to.be.undefined;
      expect(clone.getById(0)).to.not.be.undefined;
    });
  });

  //#endregion DELETE

  //#region Serializing

  describe('#hasChanged', function() {
    context('return value when unedited', function() {
      it('should return true for a fresh stbl', function() {
        const stbl = StringTableResource.create();
        expect(stbl.hasChanged).to.be.true;
      });
  
      it('should return false for a loaded stbl', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged).to.be.false;
      });

      it('should return true for a merged stbl', function() {
        const stbl1 = StringTableResource.create();
        const stbl2 = StringTableResource.create();
        const merged = StringTableResource.merge(stbl1, stbl2);
        expect(merged.hasChanged).to.be.true;
      });
    });
    
    context('return value after adding', function() {
      it('should return true after addEntry()', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged).to.be.false;
        stbl.add(1234, "Test");
        expect(stbl.hasChanged).to.be.true;
      });
  
      it('should return true after addAndHash()', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged).to.be.false;
        stbl.addAndHash("Test");
        expect(stbl.hasChanged).to.be.true;
      });
  
      it('should return false after combine() an empty stbl', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged).to.be.false;
        const newStbl = StringTableResource.create();
        stbl.combine(newStbl);
        expect(stbl.hasChanged).to.be.false;
      });

      it('should return true after combine() a non-empty stbl', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged).to.be.false;
        const newStbl = StringTableResource.create();
        newStbl.add(123, "Test");
        stbl.combine(newStbl);
        expect(stbl.hasChanged).to.be.true;
      });
    });

    context('return value after updating', function() {
      it("should return true after updating an entry's key", function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged).to.be.false;
        stbl.entries[0].key = 123;
        expect(stbl.hasChanged).to.be.true;
      });

      it("should return true after updating an entry's string", function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged).to.be.false;
        stbl.entries[0].string = "Something";
        expect(stbl.hasChanged).to.be.true;
      });
    });

    context('return value after removing', function() {
      it('should return true after remove()', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged).to.be.false;
        stbl.remove(stbl.entries[0]);
        expect(stbl.hasChanged).to.be.true;
      });

      it('should return true after delete()', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged).to.be.false;
        stbl.entries[0].delete();
        expect(stbl.hasChanged).to.be.true;
      });

      it('should return false after failing to remove', function() {
        const stbl = getSTBL('SmallSTBL');
        const clone = stbl.clone();
        const entry = clone.add(123, "Hi");
        expect(stbl.hasChanged).to.be.false;
        stbl.remove(entry);
        expect(stbl.hasChanged).to.be.false;
      });
    });

    context('return value after editing and getting buffer', function() {
      it('should return false after adding an entry and getting the buffer', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged).to.be.false;
        stbl.add(123, "Test");
        expect(stbl.hasChanged).to.be.true;
        stbl.buffer;
        expect(stbl.hasChanged).to.be.false;
      });
  
      it('should return false after updating an entry and getting the buffer', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged).to.be.false;
        stbl.entries[0].string = "Hello";
        expect(stbl.hasChanged).to.be.true;
        stbl.buffer;
        expect(stbl.hasChanged).to.be.false;
      });
  
      it('should return false after removing an entry and getting the buffer', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged).to.be.false;
        stbl.entries[0].delete();
        expect(stbl.hasChanged).to.be.true;
        stbl.buffer;
        expect(stbl.hasChanged).to.be.false;
      });
    });
  });

  describe('#buffer', function() {
    it('should not be assignable', function() {
      const stbl = StringTableResource.create();
      expect(() => stbl.buffer = undefined).to.throw();
    })

    context('fresh string table', function() {
      context('stbl is empty', function() {
        it('should return a binary that can be re-read as a STBL', function() {
          const created = StringTableResource.create();
          const buffer = created.buffer;
          const loaded = StringTableResource.from(buffer);
          expect(loaded).to.have.lengthOf(0);
          expectSameContents(created, loaded);
        });
      });

      context('stbl had entries added', function() {
        it('should return a binary that can be re-read as a STBL', function() {
          const created = StringTableResource.create();
          created.add(1234, "First");
          created.add(5678, "Second");
          const buffer = created.buffer;
          const loaded = StringTableResource.from(buffer);
          expect(loaded).to.have.lengthOf(2);
          expectSameContents(created, loaded);
        });

        it('should serialize a stbl with special characters correctly', function() {
          const created = StringTableResource.create();
          created.add(1234, "Héllö");
          created.add(5678, "Wørłd");
          const buffer = created.buffer;
          const loaded = StringTableResource.from(buffer);
          expect(loaded).to.have.lengthOf(2);
          expectSameContents(created, loaded);
        });

        it('should serialize a stbl with non-latin writing correctly', function() {
          const stbl = StringTableResource.create();
          stbl.add(123, "日本語"); // japanese
          stbl.add(456, "繁體中文"); // chinese
          stbl.add(789, "Русский"); // russian
          stbl.add(246, "한국어"); // korean
          const loaded = StringTableResource.from(stbl.buffer);
          expect(loaded.getByKey(123).string).to.equal("日本語");
          expect(loaded.getByKey(456).string).to.equal("繁體中文");
          expect(loaded.getByKey(789).string).to.equal("Русский");
          expect(loaded.getByKey(246).string).to.equal("한국어");
        });
      });
    });

    context('loaded string table', function() {
      context('stbl was untouched', function() {
        it('should return a binary that can be re-read as a STBL', function() {
          const stbl = getSTBL('SmallSTBL');
          const loaded = StringTableResource.from(stbl.buffer);
          expectSameContents(stbl, loaded);
        });

        it('should serialize a stbl with special characters correctly', function() {
          const stbl = getSTBL('SpecialChars');
          const loaded = StringTableResource.from(stbl.buffer);
          expectSameContents(stbl, loaded);
        });
      });

      context('stbl had entries added', function() {
        it('should return a binary that can be re-read as a STBL', function() {
          const stbl = getSTBL('SmallSTBL');
          const originalLength = stbl.length;
          stbl.add(1234, "Test");
          const loaded = StringTableResource.from(stbl.buffer);
          expect(loaded).to.have.lengthOf(originalLength + 1);
        });

        it('should serialize a stbl with special characters correctly', function() {
          const stbl = getSTBL('SpecialChars');
          const originalLength = stbl.length;
          stbl.add(1234, "Tést");
          const loaded = StringTableResource.from(stbl.buffer);
          expect(loaded).to.have.lengthOf(originalLength + 1);
          expect(loaded.getByKey(1234).string).to.equal("Tést");
        });
      });

      context('stbl had entries updated', function() {
        it('should return a binary that can be re-read as a STBL', function() {
          const stbl = getSTBL('SmallSTBL');
          const originalFirstString = stbl.entries[0].string;
          stbl.entries[0].string = originalFirstString + ".";
          const loaded = StringTableResource.from(stbl.buffer);
          expect(loaded.entries[0]).to.not.equal(originalFirstString);
        });
      });

      context('stbl had entries removed', function() {
        it('should return a binary that can be re-read as a STBL', function() {
          const stbl = getSTBL('SmallSTBL');
          const originalLength = stbl.length;
          stbl.entries[0].delete();
          const loaded = StringTableResource.from(stbl.buffer);
          expect(loaded).to.have.lengthOf(originalLength - 1);
        });
      });
    });
  });

  //#endregion Serializing
});
