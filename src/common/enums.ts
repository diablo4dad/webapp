export function enumKeys<O extends object, K extends keyof O = keyof O>(
  obj: O,
): K[] {
  return Object.keys(obj).filter((k) => Number.isNaN(Number(k))) as K[];
}

export function enumValues<O extends Record<keyof O, number>>(
  obj: O,
): number[] {
  return Object.keys(obj)
    .filter((key) => !isNaN(Number(key)))
    .map((key) => Number(key));
}
