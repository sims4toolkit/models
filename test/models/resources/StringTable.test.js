// const { StringTableResource, TuningResource } = require('../dst/api');

// const stbl = StringTableResource.create();
// stbl.addEntry(123456, "Hello");
// stbl.addEntry(67890, "World");
// stbl.addEntry(2468, "foo");
// stbl.addEntry(1357, "bar");
// const entries = stbl.getEntries();
// console.log("all:", entries);
// console.log("get by key:", stbl.getEntryByKey(123456));
// console.log("removed:", stbl.removeEntries(entry => entry.key <= 2468));
// console.log("all:", stbl.getEntries());


// const stbl2 = new StringTableResource();

var assert = require('assert');

describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
});
