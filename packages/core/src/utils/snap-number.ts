export const snapNumber = (value: number, step: number): number => {
  return step * Math.round(value / step);
};
