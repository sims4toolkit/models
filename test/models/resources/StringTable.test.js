const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;
const { StringTableResource } = require('../../../dst/api');

function getSTBL(filename) {
  const filepath = path.resolve(__dirname, `../../data/stbls/${filename}`);
  const buffer = fs.readFileSync(filepath);
  return StringTableResource.from(buffer);
}

function assertEntry(entry, id, key, string) {
  expect(entry.id).to.equal(id);
  expect(entry.key).to.equal(key);
  expect(entry.string).to.equal(string);
}

describe('StringTableResource', function() {
  describe('#from()', function() {
    it('should load the contents correctly', function() {
      const stbl = getSTBL('SmallSTBL.stbl');
      const entries = stbl.getEntries();
      expect(entries).to.be.an('Array');
      expect(entries).to.have.length(3);
      assertEntry(entries[0], 0, 0x7E08629A, 'This is a string.');
      assertEntry(entries[1], 1, 0xF098F4B5, 'This is another string!');
      assertEntry(entries[2], 2, 0x8D6D117D, 'And this, this is a third.');
    });

    it('should load repeated entries uniquely', function() {
      const stbl = getSTBL('RepeatedStrings.stbl');
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

    // TODO: test for failure
  });
});
