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
  const lowerString = value.toLowerCase();
  for (let i = 0; i < value.length; i++) {
    hash *= prime;
    hash %= max;
    hash ^= BigInt(lowerString.charCodeAt(i));
  }
  return hash;
}

/**
 * Sets the high bit of the given value to 1.
 * 
 * @param value Value to set high bit of
 * @param bits Number of bits
 * @returns Value with its highest bit set to 1
 */
function setHighBit(value: bigint, bits: bigint): bigint {
  return value | (2n ** (bits - 1n));
}

/**
 * Gets the 24-bit FNV-1 hash of the given string.
 * 
 * @param value String to hash
 * @returns 24-bit FNV-1 hash of given string
 */
export function fnv24(value: string): number {
  return fnv32to24(fnv32(value));
}

/**
 * Gets the 32-bit FNV-1 hash of the given string.
 * 
 * @param value String to hash
 * @param highBit Whether or not the force the high bit to 1
 * @returns 32-bit FNV-1 hash of given string
 */
export function fnv32(value: string, highBit = false): number { 
  const hash = fnv(value, 0x811C9DC5n, 0x01000193n, 0x100000000n);
  return Number(highBit ? setHighBit(hash, 32n) : hash);
}

/**
 * Gets the 56-bit FNV-1 hash of the given string.
 * 
 * @param value String to hash
 * @returns 56-bit FNV-1 hash of given string
 */
export function fnv56(value: string): bigint {
  return fnv64to56(fnv64(value));
}

/**
 * Gets the 64-bit FNV-1 hash of the given string.
 * 
 * @param value String to hash
 * @param highBit Whether or not the force the high bit to 1
 * @returns 64-bit FNV-1 hash of given string
 */
export function fnv64(value: string, highBit = false): bigint {
  const hash = fnv(value, 0xCBF29CE484222325n, 0x00000100000001B3n, 0x10000000000000000n);
  return highBit ? setHighBit(hash, 64n) : hash;
}

/**
 * Converts the given 32-bit hash to 24-bit.
 * 
 * @param hash Hash value to convert
 */
export function fnv32to24(hash: number): number {
  const high = (hash & 0xFF000000) >>> 24;
  const base = hash & 0xFFFFFF;
  return base ^ high;
}

/**
 * Converts the given 64-bit hash to 56-bit.
 * 
 * @param hash Hash value to convert
 */
export function fnv64to56(hash: bigint): bigint {
  const high = ((hash & 0xFF00000000000000n) >> 56n) & 0xFFn;
  const base = hash & 0xFFFFFFFFFFFFFFn;
  return base ^ high;
}
