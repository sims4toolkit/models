const { StringTableResource } = require('../dst/api').default;

const stbl = StringTableResource.create();
stbl.addEntry(123456, "Hello");
stbl.addEntry(67890, "World");
stbl.addEntry(2468, "foo");
stbl.addEntry(1357, "bar");
const entries = stbl.getEntries();
console.log("all:", entries);
console.log("get by key:", stbl.getEntryByKey(123456));
console.log("removed:", stbl.removeEntries(entry => entry.key <= 2468));
console.log("all:", stbl.getEntries());