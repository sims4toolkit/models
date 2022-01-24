/**
 * Creates an array with a set number of arguments populated by a function. If
 * `skipNulls = true`, then any iterations of the function that return either
 * `undefined` or `null` will not be added to the resulting array.
 * 
 * @param length Number of items to populate the array with
 * @param fn Function that dictates what the array items should be
 * @returns Array containing values generated by the function
 */
export function makeList<T>(length: number, fn: (index: number) => T, skipNulls = false): T[] {
  const list: T[] = [];
  for (let i = 0; i < length; i++) {
    const item = fn(i)
    if ((item != undefined) || !skipNulls) list.push(item);
  }
  return list;
}

/**
 * Removes objects from the given array by reference equality.
 * 
 * @param toRemove Objects to remove
 * @param removeFrom Array to remove objects from
 * @returns True if at least one item was removed, else false
 */
export function removeFromArray<T>(toRemove: T[], removeFrom: T[]): boolean {
  let anyRemoved = false;
  toRemove.forEach(obj => {
    const index = removeFrom.findIndex(o => o === obj);
    if (index < 0) return;
    removeFrom.splice(index, 1);
    anyRemoved = true;
  });
  return anyRemoved;
}

/** Represents an object that has an `equals()` method. */
type Equalable = { equals(item: any): boolean; };

/**
 * Checks if the two given arrays contain the same contents, as dictacted by
 * the first array's children's `equals()` methods. The elements do not need to
 * be in the same order. Time complexity is O(n^2), so use sparingly.
 * 
 * @param arr1 First array to check
 * @param arr2 Second array to check
 */
export function arraysAreEqual(arr1: Equalable[], arr2: any[]): boolean {
  if (arr1.length !== arr2?.length) return false;
  return arr1.every(a => arr2.some(b => a.equals(b)));
}

/**
 * Checks the given buffer and returns whether or not it contains XML content.
 * This is determined by the presence of an XML header, so it will return false
 * for XML files that do not have a header.
 * 
 * @param buffer Buffer to check contens of
 * @returns True if this buffer contains XML, false otherwise
 */
export function bufferContainsXml(buffer: Buffer): boolean {
  return buffer.length >= 5 && buffer.slice(0, 5).toString('utf-8') === '<?xml';
}
