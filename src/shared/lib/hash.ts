export function hashCode(input: number[]) {
  return Math.abs(
    input.sort().reduce((hash, i) => {
      return (hash << 5) - hash + i;
    }, 0),
  );
}

export function hashCodeFromString(input: string): number {
  return Math.abs(
    input.split("").reduce((hash, i) => {
      return ((hash << 5) - (hash + i.charCodeAt(0))) | 0;
    }, 0),
  );
}
