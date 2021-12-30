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
 * Returns a proxy that will listen for any changes to the given array.
 * 
 * @param arr Array to get proxy for
 * @param fn Function to call when the array is mutated
 * @returns Proxy for given array
 */
export function getArrayProxy<T>(arr: T[], fn: (target: T[], property: string | symbol, value: any) => void): T[] {
  return new Proxy(arr, {
    set: function(target, property, value) {
      const ref = Reflect.set(target, property, value);
      fn(target, property, value);
      return ref;
    }
  });
}