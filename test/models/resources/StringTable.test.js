const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;
const { StringTableResource, Hashing } = require('../../../dst/api');

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
  expect(stbl1.numEntries()).to.equal(stbl2.numEntries());
  stbl1.getEntries((entry, i) => {
    const other = stbl2.getEntryByIndex(i);
    expect(entry.key).to.equal(other.key);
    expect(entry.string).to.equal(other.string);
  });
}

function expectNoMutationOnAdd(stbl1, stbl2) {
  const originalLength = stbl1.numEntries();
  expect(stbl2.numEntries()).to.equal(originalLength);
  stbl2.addEntry(1234, "Test");
  expect(stbl1.numEntries()).to.equal(originalLength);
  expect(stbl2.numEntries()).to.equal(originalLength + 1);
}

function expectNoMutationOnUpdate(stbl1, stbl2) {
  const originalEntry = stbl1.getEntryByIndex(0);
  const originalKey = originalEntry.key;
  const originalString = originalEntry.string;
  stbl2.updateEntryByIndex(0, { key: originalKey + 1, string: originalString + "." });
  const resultEntry = stbl1.getEntryByIndex(0);
  stbl1.getEntryByIndex(0);
  expect(resultEntry.key).to.equal(originalKey);
  expect(resultEntry.string).to.equal(originalString);
}

function expectNoMutationOnRemove(stbl1, stbl2) {
  const originalLength = stbl1.numEntries();
  expect(stbl2.numEntries()).to.equal(originalLength);
  stbl2.removeEntryByIndex(0);
  expect(stbl1.numEntries()).to.equal(originalLength);
  expect(stbl2.numEntries()).to.equal(originalLength - 1);
}

//#endregion Helpers

describe('StringTableResource', function() {
  //#region Initialization

  describe('#create()', function() {
    it('should create a valid, empty string table', function() {
      const stbl = StringTableResource.create();
      expect(stbl).to.not.be.undefined;
      expect(stbl.getEntries()).to.have.lengthOf(0);
    });
  });

  describe('#from()', function() {
    context('file is valid', function() {
      it('should load the contents correctly', function() {
        const stbl = getSTBL('SmallSTBL');
        const entries = stbl.getEntries();
        expect(entries).to.be.an('Array');
        expect(entries).to.have.length(3);
        assertEntry(entries[0], 0, 0x7E08629A, 'This is a string.');
        assertEntry(entries[1], 1, 0xF098F4B5, 'This is another string!');
        assertEntry(entries[2], 2, 0x8D6D117D, 'And this, this is a third.');
      });
  
      it('should load repeated entries uniquely', function() {
        const stbl = getSTBL('RepeatedStrings');
        const entries = stbl.getEntries();
        expect(entries).to.be.an('Array');
        expect(entries).to.have.length(6);
  
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
        expect(stbl.clone().numEntries()).to.equal(0);
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
        expect(stbl.numEntries()).to.equal(0);
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
          expect(merged.numEntries()).to.equal(0);
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
          freshSTBL.addEntry(1234, "First");
          freshSTBL.addEntry(5678, "Second");
          const merged = StringTableResource.merge(smallSTBL, freshSTBL);
          expect(merged.numEntries()).to.equal(smallSTBL.numEntries() + 2);
          smallSTBL.addEntry(1234, "First");
          smallSTBL.addEntry(5678, "Second");
          expectSameContents(smallSTBL, merged);
        });
      });
    });

    context('merging three', function() {
      it('should return new stbl with entries from all three', function() {
        const stbl1 = StringTableResource.create();
        stbl1.addEntry(123, "First");
        const stbl2 = StringTableResource.create();
        stbl2.addEntry(456, "Second");
        const stbl3 = StringTableResource.create();
        stbl3.addEntry(789, "Third");
        const merged = StringTableResource.merge(stbl1, stbl2, stbl3);
        expect(merged.numEntries()).to.equal(3);
        expect(merged.getEntryByIndex(0).string).to.equal("First");
        expect(merged.getEntryByIndex(1).string).to.equal("Second");
        expect(merged.getEntryByIndex(2).string).to.equal("Third");
      });
    });
  });

  //#endregion Initialization

  //#region Add

  describe('#addEntry()', function() {
    it('should add the entry correctly to a new STBL', function() {
      const stbl = StringTableResource.create();
      expect(stbl.numEntries()).to.equal(0);
      const id = stbl.addEntry(1234, 'New string');
      expect(stbl.numEntries()).to.equal(1);
      assertEntry(stbl.getEntryById(id), id, 1234, 'New string');
    });

    it('should add the entry correctly to an existing STBL', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl.numEntries()).to.equal(3);
      const id = stbl.addEntry(1234, 'New string');
      expect(stbl.numEntries()).to.equal(4);
      assertEntry(stbl.getEntryById(id), id, 1234, 'New string');
    });

    it('should throw if key exceeds 32-bit', function() {
      const stbl = StringTableResource.create();
      expect(() => stbl.addEntry(0x100000000, "Test")).to.throw("Key must be 32-bit.");
    });

    it('should return the correct ID on a new STBL', function() {
      const stbl = StringTableResource.create();
      expect(stbl.addEntry(1234, "First")).to.equal(0);
      expect(stbl.addEntry(5678, "Second")).to.equal(1);
      expect(stbl.addEntry(2468, "Third")).to.equal(2);
    });

    it('should return the correct ID on an existing STBL', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl.addEntry(1234, "New string")).to.equal(3);
    });

    it('should not recycle IDs after removing an entry', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl.addEntry(1234, "New string")).to.equal(3);
      stbl.removeEntryByIndex(3);
      expect(stbl.addEntry(5678, "Another string")).to.equal(4);
    });
  });

  describe('#addStringAndHash()', function() {
    context('name is given', function() {
      it("should add one entry with the name's 32-bit hash", function() {
        const stbl = StringTableResource.create();
        const string = "This is the string";
        const name = "frankk_TEST:string_Name";
        stbl.addStringAndHash(string, name);
        expect(stbl.numEntries()).to.equal(1);
        const entry = stbl.getEntryByIndex(0);
        expect(entry.key).to.equal(Hashing.fnv32(name));
        expect(entry.string).to.equal(string);
      });
    });

    context('name is not given', function() {
      it("should add one entry with the string's 32-bit hash", function() {
        const stbl = StringTableResource.create();
        const string = "This is the string";
        stbl.addStringAndHash(string);
        expect(stbl.numEntries()).to.equal(1);
        const entry = stbl.getEntryByIndex(0);
        expect(entry.key).to.equal(Hashing.fnv32(string));
        expect(entry.string).to.equal(string);
      });
    });
  });

  describe('#combine()', function() {
    context('original is empty', function() {
      context('adding empty stbl', function() {
        it('should still be empty', function() {
          const stbl = StringTableResource.create();
          const empty = StringTableResource.create();
          stbl.combine(empty);
          expect(stbl.numEntries()).to.equal(0);
        });
      });
  
      context('adding stbl with entries', function() {
        it('should contain the same entries as the given one', function() {
          const empty = StringTableResource.create();
          const withEntries = getSTBL('SmallSTBL');
          empty.combine(withEntries);
          expect(empty.numEntries()).to.not.equal(0);
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
          stbl2.addEntry(1234, "Test");
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
      });
  
      context('adding stbl with entries', function() {
        it('should add the entries from the given one', function() {
          const smallStbl = getSTBL('SmallSTBL');
          const originalEntries = smallStbl.numEntries();
          const other = StringTableResource.create();
          other.addEntry(1234, "Test");
          other.addEntry(5678, "Test 2");
          const merged = StringTableResource.merge(smallStbl, other);
          smallStbl.combine(other);
          expect(smallStbl.numEntries()).to.equal(originalEntries + 2);
          expectSameContents(smallStbl, merged);
        });
      });

      context('adding multiple stbls with entries', function() {
        it('should add all entries from all given ones', function() {
          const smallStbl = getSTBL('SmallSTBL');

          const other1 = StringTableResource.create();
          other1.addEntry(1234, "Test 1");
          other1.addEntry(5678, "Test 2");

          const other2 = StringTableResource.create();
          other2.addEntry(2468, "Test 3");
          other2.addEntry(1357, "Test 4");

          const merged = StringTableResource.merge(smallStbl, other1, other2);
          smallStbl.combine(other1, other2);

          expectSameContents(smallStbl, merged);
        });
      });
    });
  });

  //#endregion Add

  //#region Update

  describe('#updateEntry()', function() {
    // TODO:
  });

  describe('#updateEntryById()', function() {
    // TODO:
  });

  describe('#updateEntryByKey()', function() {
    // TODO:
  });

  describe('#updateEntryByIndex()', function() {
    // TODO:
  });

  //#endregion Update

  //#region Remove

  describe('#removeEntry()', function() {
    // TODO:
  });

  describe('#removeEntries()', function() {
    // TODO:
  });

  describe('#removeEntryById()', function() {
    // TODO:
  });

  describe('#removeEntryByKey()', function() {
    // TODO:
  });

  describe('#removeEntryByIndex()', function() {
    // TODO:
  });

  //#endregion Remove

  //#region Get

  describe('#getEntry()', function() {
    it('should return the only entry that matches the predicate', function() {
      // TODO:
    });

    it('should return the first entry that matches the predicate', function() {
      // TODO:
    });

    it('should return undefined if none match the predicate', function() {
      // TODO:
    });
  });

  describe('#getEntries()', function() {
    it('should return all entries when there is no predicate', function() {
      // TODO:
    });

    it('should return all entries that match the predicate', function() {
      // TODO:
    });

    it('should return an empty array if none match the predicate', function() {
      // TODO:
    });
  });

  describe('#getEntryById()', function() {
    it('should return the correct entry', function() {
      const stbl = StringTableResource.create();
      const firstId = stbl.addEntry(123, "First");
      const secondId = stbl.addEntry(456, "Second");
      const first = stbl.getEntryById(firstId);
      const second = stbl.getEntryById(secondId);
      expect(first.key).to.equal(123);
      expect(second.key).to.equal(456);
    });

    it('should return undefined when the id doesn\'t exist', function() {
      const stbl = getSTBL('SmallSTBL');
      const entry = stbl.getEntryById(3);
      expect(entry).to.be.undefined;
    });

    it('should return undefined when there was an entry with this id, but it was removed', function() {
      const stbl = getSTBL('SmallSTBL');
      expect(stbl.getEntryById(0)).to.not.be.undefined;
      stbl.removeEntryById(0);
      expect(stbl.getEntryById(0)).to.be.undefined;
    });
  });

  describe('#getEntryByKey()', function() {
    it('should return the correct entry', function() {
      const stbl = StringTableResource.create();
      stbl.addEntry(123, "First");
      stbl.addEntry(456, "Second");
      const first = stbl.getEntryByKey(123);
      const second = stbl.getEntryByKey(456);
      expect(first.string).to.equal("First");
      expect(second.string).to.equal("Second");
    });

    it('should return the first entry if there is more than one with this key', function() {
      const stbl = StringTableResource.create();
      stbl.addEntry(123, "First");
      stbl.addEntry(123, "Second");
      const entry = stbl.getEntryByKey(123);
      expect(entry.string).to.equal("First");
    });

    it('should return undefined when the key doesn\'t exist', function() {
      const stbl = StringTableResource.create();
      stbl.addEntry(123, "First");
      stbl.addEntry(456, "Second");
      const entry = stbl.getEntryByKey(789);
      expect(entry).to.be.undefined;
    });

    it('should return undefined when there was an entry with this key, but it was removed', function() {
      const stbl = StringTableResource.create();
      stbl.addEntry(123, "First");
      stbl.addEntry(456, "Second");
      expect(stbl.getEntryByKey(123)).to.not.be.undefined;
      stbl.removeEntryByKey(123);
      expect(stbl.getEntryByKey(123)).to.be.undefined;
    });
  });

  describe('#getEntriesByKey()', function() {
    it('should return an empty array if there are none with this key', function() {
      const stbl = StringTableResource.create();
      stbl.addEntry(123, "First");
      stbl.addEntry(456, "Second");
      const entries = stbl.getEntriesByKey(789);
      expect(entries).to.be.an('Array');
      expect(entries).to.be.empty;
    });

    it('should return an array with one entry if there is one with this key', function() {
      const stbl = StringTableResource.create();
      stbl.addEntry(123, "First");
      stbl.addEntry(456, "Second");
      const entries = stbl.getEntriesByKey(123);
      expect(entries).to.be.an('Array');
      expect(entries).to.have.lengthOf(1);
      expect(entries[0].string).to.equal("First");
    });

    it('should return an array of all entries with this key', function() {
      const stbl = StringTableResource.create();
      stbl.addEntry(123, "First");
      stbl.addEntry(123, "Second");
      const entries = stbl.getEntriesByKey(123);
      expect(entries).to.be.an('Array');
      expect(entries).to.have.lengthOf(2);
      expect(entries[0].string).to.equal("First");
      expect(entries[1].string).to.equal("Second");
    });
  });

  describe('#getEntryByIndex()', function() {
    it('should return the correct entry', function() {
      // TODO:
    });

    it('should return the correct entry after one before it is deleted', function() {
      // TODO:
    });

    it('should return the same entry after one is added', function() {
      // TODO:
    });

    it('should return undefined when index is negative', function() {
      // TODO:
    });

    it('should return undefined when index is out of bounds', function() {
      // TODO:
    });
  });

  describe('#searchByString()', function() {
    context('no options are passed', function() {
      it('should return empty array on empty stbl', function() {
        // TODO:
      });

      it('should return empty array when there are no case-insentive exact matches', function() {
        // TODO:
      });

      it('should return array of all case-insentive exact matches', function() {
        // TODO:
      });
    });

    context('case sensitive set to true', function() {
      it('should return all exact matches in same case', function() {
        // TODO:
      });

      it('should return empty array when there are exact matches in different case', function() {
        // TODO:
      });
    });

    context('search for substrings', function() {
      it('should return empty array when none contain the substring', function() {
        // TODO:
      });

      it('should return all entries that contain the substring in same case', function() {
        // TODO:
      });

      it('should return all entries that contain the substring in different case', function() {
        // TODO:
      });
    });

    context('case sensitive set to true & search for substrings', function() {
      it('should return empty array when contains substring, but not in right case', function() {
        // TODO:
      });

      it('should return all entries that contain substring in right case', function() {
        // TODO:
      });
    });
  });

  //#endregion Get

  //#region Utility

  describe('#numEntries()', function() {
    context('empty STBL', function() {
      it('should be 0', function() {
        const stbl = StringTableResource.create();
        expect(stbl.numEntries()).to.equal(0);
      });

      it('should increase by 1 after adding an entry', function() {
        const stbl = StringTableResource.create();
        expect(stbl.numEntries()).to.equal(0);
        stbl.addEntry(1234, 'New string');
        expect(stbl.numEntries()).to.equal(1);
      });

      it('should stay the same after failing to remove', function() {
        const stbl = StringTableResource.create();
        expect(stbl.numEntries()).to.equal(0);
        expect(stbl.removeEntryByIndex(0)).to.be.undefined;
        expect(stbl.numEntries()).to.equal(0);
      });
    });

    context('existing STBL with 3 entries', function() {
      it('should be 3', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.numEntries()).to.equal(3);
      });

      it('should increase by 1 after adding an entry', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.numEntries()).to.equal(3);
        stbl.addEntry(1234, 'New string');
        expect(stbl.numEntries()).to.equal(4);
      });
  
      it('should decrease by 1 after removing an entry', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.numEntries()).to.equal(3);
        stbl.removeEntryById(0);
        expect(stbl.numEntries()).to.equal(2);
      });

      it('should stay the same after failing to remove', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.numEntries()).to.equal(3);
        expect(stbl.removeEntryByIndex(3)).to.be.undefined;
        expect(stbl.numEntries()).to.equal(3);
      });
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
        stbl.addEntry(1234, "String 1");
        stbl.addEntry(1234, "String 2");
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
        stbl.addEntry(1234, "String 1");
        stbl.addEntry(5678, "String 1");
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
        stbl.addEntry(1234, "String");
        stbl.addEntry(5678, "");
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
        stbl.addEntry(123, "String 1");
        stbl.addEntry(123, "String 2");
        stbl.addEntry(456, "String 2");
        stbl.addEntry(789, "");
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

  //#endregion Utility

  //#region Serializing

  describe('#hasChanged()', function() {
    context('return value when unedited', function() {
      it('should return true for a fresh stbl', function() {
        const stbl = StringTableResource.create();
        expect(stbl.hasChanged()).to.be.true;
      });
  
      it('should return false for a loaded stbl', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged()).to.be.false;
      });

      it('should return true for a merged stbl', function() {
        const stbl1 = StringTableResource.create();
        const stbl2 = StringTableResource.create();
        const merged = StringTableResource.merge(stbl1, stbl2);
        expect(merged.hasChanged()).to.be.true;
      });
    });
    
    context('return value after adding', function() {
      it('should return true after addEntry()', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged()).to.be.false;
        stbl.addEntry(1234, "Test");
        expect(stbl.hasChanged()).to.be.true;
      });
  
      it('should return true after addStringAndHash()', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged()).to.be.false;
        stbl.addStringAndHash("Test");
        expect(stbl.hasChanged()).to.be.true;
      });
  
      it('should return false after combine() an empty stbl', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged()).to.be.false;
        const newStbl = StringTableResource.create();
        stbl.combine(newStbl);
        expect(stbl.hasChanged()).to.be.false;
      });

      it('should return true after combine() a non-empty stbl', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged()).to.be.false;
        const newStbl = StringTableResource.create();
        newStbl.addEntry(123, "Test");
        stbl.combine(newStbl);
        expect(stbl.hasChanged()).to.be.true;
      });
    });

    context('return value after updating', function() {
      it('should return true after updateEntry()', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged()).to.be.false;
        stbl.updateEntry(entry => entry.id === 0, { string: "Test" });
        expect(stbl.hasChanged()).to.be.true;
      });
  
      it('should return true after updateEntryByKey()', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged()).to.be.false;
        stbl.updateEntryByKey(0x7E08629A, { string: "Test" });
        expect(stbl.hasChanged()).to.be.true;
      });
  
      it('should return true after updateEntryById()', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged()).to.be.false;
        stbl.updateEntryById(0, { string: "Test" });
        expect(stbl.hasChanged()).to.be.true;
      });

      it('should return true after updateEntryByIndex()', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged()).to.be.false;
        stbl.updateEntryByIndex(0, { string: "Test" });
        expect(stbl.hasChanged()).to.be.true;
      });

      it('should return false after failing to update', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged()).to.be.false;
        const result = stbl.updateEntryByIndex(10, { string: "Test" });
        expect(result).to.be.undefined;
        expect(stbl.hasChanged()).to.be.false;
      });
    });

    context('return value after removing', function() {
      it('should return true after removeEntry()', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged()).to.be.false;
        stbl.removeEntry(entry => entry.id === 0);
        expect(stbl.hasChanged()).to.be.true;
      });
  
      it('should return true after removeEntries()', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged()).to.be.false;
        stbl.removeEntries(entry => entry.id > 1);
        expect(stbl.hasChanged()).to.be.true;
      });
  
      it('should return true after removeEntryById()', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged()).to.be.false;
        stbl.removeEntryById(0);
        expect(stbl.hasChanged()).to.be.true;
      });

      it('should return true after removeEntryByKey()', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged()).to.be.false;
        stbl.removeEntryByKey(0x7E08629A);
        expect(stbl.hasChanged()).to.be.true;
      });

      it('should return true after removeEntryByIndex()', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged()).to.be.false;
        stbl.removeEntryByIndex(0);
        expect(stbl.hasChanged()).to.be.true;
      });

      it('should return false after failing to remove', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged()).to.be.false;
        stbl.removeEntryByIndex(10);
        expect(stbl.hasChanged()).to.be.false;
      });
    });

    context('return value after editing and getting buffer', function() {
      it('should return false after adding an entry and getting the buffer', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged()).to.be.false;
        stbl.addEntry(123, "Test");
        expect(stbl.hasChanged()).to.be.true;
        stbl.getBuffer();
        expect(stbl.hasChanged()).to.be.false;
      });
  
      it('should return false after updating an entry and getting the buffer', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged()).to.be.false;
        stbl.updateEntryByIndex(0, { string: "Test" });
        expect(stbl.hasChanged()).to.be.true;
        stbl.getBuffer();
        expect(stbl.hasChanged()).to.be.false;
      });
  
      it('should return false after removing an entry and getting the buffer', function() {
        const stbl = getSTBL('SmallSTBL');
        expect(stbl.hasChanged()).to.be.false;
        stbl.removeEntryByIndex(0);
        expect(stbl.hasChanged()).to.be.true;
        stbl.getBuffer();
        expect(stbl.hasChanged()).to.be.false;
      });
    });
  });

  describe('#getBuffer()', function() {
    context('fresh string table', function() {
      context('stbl is empty', function() {
        it('should return a binary that can be re-read as a STBL', function() {
          const created = StringTableResource.create();
          const buffer = created.getBuffer();
          const loaded = StringTableResource.from(buffer);
          expect(loaded.numEntries()).to.equal(0);
          expectSameContents(created, loaded);
        });
      });

      context('stbl had entries added', function() {
        it('should return a binary that can be re-read as a STBL', function() {
          const created = StringTableResource.create();
          created.addEntry(1234, "First");
          created.addEntry(5678, "Second");
          const buffer = created.getBuffer();
          const loaded = StringTableResource.from(buffer);
          expect(loaded.numEntries()).to.equal(2);
          expectSameContents(created, loaded);
        });
      });
    });

    context('loaded string table', function() {
      context('stbl was untouched', function() {
        it('should return a binary that can be re-read as a STBL', function() {
          const stbl = getSTBL('SmallSTBL');
          const buffer = stbl.getBuffer();
          const loaded = StringTableResource.from(buffer);
          expectSameContents(stbl, loaded);
        });
      });

      context('stbl had entries added', function() {
        it('should return a binary that can be re-read as a STBL', function() {
          const stbl = getSTBL('SmallSTBL');
          const originalLength = stbl.numEntries();
          stbl.addEntry(1234, "Test");
          const buffer = stbl.getBuffer();
          const loaded = StringTableResource.from(buffer);
          expect(loaded.numEntries()).to.equal(originalLength + 1);
        });
      });

      context('stbl had entries updated', function() {
        it('should return a binary that can be re-read as a STBL', function() {
          const stbl = getSTBL('SmallSTBL');
          const originalFirstString = stbl.getEntryByIndex(0).string;
          stbl.updateEntryByIndex(0, originalFirstString + ".");
          const buffer = stbl.getBuffer();
          const loaded = StringTableResource.from(buffer);
          expect(loaded.getEntryByIndex(0)).to.not.equal(originalFirstString);
        });
      });

      context('stbl had entries removed', function() {
        it('should return a binary that can be re-read as a STBL', function() {
          const stbl = getSTBL('SmallSTBL');
          const originalLength = stbl.numEntries();
          stbl.removeEntryByIndex(0);
          const buffer = stbl.getBuffer();
          const loaded = StringTableResource.from(buffer);
          expect(loaded.numEntries()).to.equal(originalLength - 1);
        });
      });
    });
  });

  //#endregion Serializing
});
