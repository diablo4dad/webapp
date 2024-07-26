export function hashCode(input: number[]) {
  return Math.abs(
    input.sort().reduce((hash, i) => {
      return (hash << 5) - hash + i;
    }, 0),
  );
}
