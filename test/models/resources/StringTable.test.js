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

    // TODO: test for failure
  });
});
