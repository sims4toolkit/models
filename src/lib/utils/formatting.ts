/**
 * Formats a number as 32-bit hex with a 0x prefix.
 * 
 * @param key String key to format
 */
export function formatStringKey(key: number): string {
  return `0x${key.toString(16).padStart(8, '0').toUpperCase()}`;
}
