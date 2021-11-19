/**
 * Creates an array with a set number of arguments populated by a function.
 * 
 * @param length Number of items to populate the array with
 * @param fn Function that dictates what the array items should be
 * @returns Array containing values generated by the function
 */
export function makeList<T>(length: number, fn: (index: number) => T): T[] {
  const list: T[] = [];
  for (let i = 0; i < length; i++) list.push(fn(i));
  return list;
}