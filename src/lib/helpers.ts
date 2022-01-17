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

/**
 * Removes objects from the given array by reference equality.
 * 
 * @param toRemove Objects to remove
 * @param removeFrom Array to remove objects from
 * @returns True if at least one item was removed, else false
 */
export function removeFromArray<T>(toRemove: T[], removeFrom: T[]) {
  let anyRemoved = false;
  toRemove.forEach(obj => {
    const index = removeFrom.findIndex(o => o === obj);
    if (index < 0) return;
    removeFrom.splice(index, 1);
    anyRemoved = true;
  });
  return anyRemoved;
}

/**
 * Checks if the two given arrays contain the same contents, as dictacted by
 * the first array's children's `equals()` methods.
 * 
 * @param arr1 First array to check
 * @param arr2 Second array to check
 */
export function arraysAreEqual(arr1: { equals(item: any): boolean; }[], arr2: any[]): boolean {
  if (arr1.length !== arr2?.length) return false;
  return arr1.every(a => arr2.some(b => a.equals(b)));
}
