const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;
const { StringTableResource } = require('../../../dst/api');

function getSTBL(filename, options = undefined) {
  const filepath = path.resolve(__dirname, `../../data/stbls/${filename}.stbl`);
  const buffer = fs.readFileSync(filepath);
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

  describe('#numEntries()', function() {
    // TODO:
  });

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

  // TODO: add tests for saving
});
