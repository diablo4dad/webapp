export function toggleValueInArray<T>(
  array: T[],
  value: T,
  toggle: boolean,
): T[] {
  if (toggle) {
    if (array.includes(value)) {
      return array;
    } else {
      return [...array, value];
    }
  } else {
    if (array.includes(value)) {
      return array.filter((e) => e !== value);
    } else {
      return array;
    }
  }
}
