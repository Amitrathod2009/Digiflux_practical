export function totalChange(values: number[]): number | null {
  if (values.length < 2) {
    return null;
  }
  return values[0] - values[values.length - 1];
}

export function rowDeltas(values: number[]): Array<number | null> {
  return values.map((value, i) =>
    i === values.length - 1 ? null : value - values[i + 1],
  );
}
