/**
 * Formats a number as 32-bit hex with a 0x prefix.
 * 
 * @param key String key to format
 */
export function formatStringKey(key: number): string {
  return formatAsHexString(key, 8, true);
}

/**
 * Formats a number or bigint as a hex string.
 * 
 * @param value Values to format as hex
 * @param digits Digits to pad start of hex number with
 * @param usePrefix Whether or not the prefix string with "0x"
 */
export function formatAsHexString(value: number | bigint, digits: number, usePrefix = false): string {
  return `${usePrefix ? '0x' : ''}${value.toString(16).padStart(digits, '0').toUpperCase()}`;
}
