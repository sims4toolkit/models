const assert = require('assert');
const hashing = require('../../dst/lib/utils/hashing');

'hello world'
'Hello World'
'HELLO WORLD'
// check previous 3 to make sure it's case insensitive

'Hé110 : wør!D'
'This is a much longer string; this one should work as well.'


const string = 'Something!';
console.log("64:", hashing.fnv64(string) === 7111974037216638096n);
console.log("56:", hashing.fnv56(string) === 50329821499700466n);
console.log("32:", hashing.fnv32(string) === 3408450032);
console.log("24:", hashing.fnv24(string) === 2675003);
