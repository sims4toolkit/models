const a = 0x890926F1;
const b = 0xA9BACF5B;
const goal = 0x890926F1A9BACF5Bn;

const result = (BigInt(a) << 32n) + BigInt(b);
console.log(result);
console.log(goal);