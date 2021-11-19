/**
 * Hashes the given string with the FNV-1 algorithm.
 * 
 * @param value String to hash
 * @param offset Starting value of hash
 * @param prime Value to multiply hash by
 * @param max Value to mod hash by
 * @returns FNV-1 hash of given string
 */
function fnv(value: string, offset: bigint, prime: bigint, max: bigint): bigint {
  let hash = offset;
  Buffer.from(value.toLowerCase(), 'utf-8').forEach(byte => {
    hash *= prime;
    hash %= max;
    hash ^= BigInt(byte);
  });
  return hash;
}

/**
 * Gets the 32-bit FNV-1 hash of the given string.
 * 
 * @param value String to hash
 * @returns 32-bit FNV-1 hash of given string
 */
export function fnv32(value: string): number { 
  return Number(fnv(value, 0x811C9DC5n, 0x01000193n, 0x100000000n));
}

/**
 * Gets the 64-bit FNV-1 hash of the given string.
 * 
 * @param value String to hash
 * @returns 64-bit FNV-1 hash of given string
 */
export function fnv64(value: string): bigint {
  return fnv(value, 0xCBF29CE484222325n, 0x00000100000001B3n, 0x10000000000000000n);
}
