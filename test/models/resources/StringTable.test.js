const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;
const { StringTableResource } = require('../../../dst/api');

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

describe('StringTableResource', function() {
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
        clone.addEntry(1234, "New String");
        expect(stbl.numEntries()).to.equal(0);
        expect(clone.numEntries()).to.equal(1);
      });

      it('should not mutate the original stbl when updating', function() {
        const stbl = getSTBL('SmallSTBL');
        const clone = stbl.clone();
        clone.updateEntryByIndex(1, { key: 1234 });
        expect(stbl.getEntryByIndex(1).key).to.not.equal(1234);
        expect(clone.getEntryByIndex(1).key).to.equal(1234);
        clone.updateEntryByIndex(2, { string: "ABCDEF" });
        expect(stbl.getEntryByIndex(2).string).to.not.equal("ABCDEF");
        expect(clone.getEntryByIndex(2).string).to.equal("ABCDEF");
      });

      it('should not mutate the original stbl when removing', function() {
        const stbl = getSTBL('SmallSTBL');
        const orignalNumEntries = stbl.numEntries();
        const clone = stbl.clone();
        clone.removeEntryByIndex(0);
        expect(stbl.numEntries()).to.equal(orignalNumEntries);
        expect(clone.numEntries()).to.equal(orignalNumEntries - 1);
      });
    });

    context('stbl has entries', function() {
      it('should return a stbl with the same entries', function() {
        const stbl = getSTBL('SmallSTBL');
        const stblClone = stbl.clone();
        expect(stblClone.numEntries()).to.equal(stbl.numEntries());
        stblClone.getEntries().forEach((entry, i) => {
          expect(entry.key).to.equal(stbl.getEntryByIndex(i).key);
          expect(entry.string).to.equal(stbl.getEntryByIndex(i).string);
        });
      });

      it('should not mutate the original stbl when edited', function() {
        const stbl = getSTBL('SmallSTBL');
        const clone = stbl.clone();
        clone.addEntry(1234, "New String");
        expect(clone.numEntries()).to.equal(stbl.numEntries() + 1);
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
        // TODO:
      });

      it('should not mutate the original when adding', function() {
        const smallStbl = getSTBL('SmallSTBL');
        const stbl = StringTableResource.merge(smallStbl);
        // TODO:
      });

      it('should not mutate the original when updating', function() {
        const smallStbl = getSTBL('SmallSTBL');
        const stbl = StringTableResource.merge(smallStbl);
        // TODO:
      });

      it('should not mutate the original when removing', function() {
        const smallStbl = getSTBL('SmallSTBL');
        const stbl = StringTableResource.merge(smallStbl);
        // TODO:
      });
    });

    context('merging two', function() {
      it('', function() {
        const stbl = StringTableResource.merge();
        // TODO:
      });
    });

    context('merging three', function() {
      it('', function() {
        const stbl = StringTableResource.merge();
        // TODO:
      });
    });
  });

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
      it('should add an entry to the table', function() {
        // TODO:
      });
  
      it('should use the 32-bit hash of the name', function() {
        // TODO:
      });
    });

    context('name is not given', function() {
      it('should add an entry to the table', function() {
        // TODO:
      });
  
      it('should use the 32-bit hash of the string', function() {
        // TODO:
      });
    });
  });

  describe('#combine()', function() {
    context('adding one string table', function() {
      // TODO:
    });

    context('adding multiple string tables', function() {
      // TODO:
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
    // TODO:
  });

  describe('#getEntries()', function() {
    // TODO:
  });

  describe('#getEntryById()', function() {
    // TODO:
  });

  describe('#getEntryByKey()', function() {
    // TODO:
  });

  describe('#getEntriesByKey()', function() {
    // TODO:
  });

  describe('#getEntriesByString()', function() {
    // TODO:
  });

  describe('#getEntryByIndex()', function() {
    // TODO:
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
    // TODO:
  });

  //#endregion Utility

  // TODO: add tests for saving
});
