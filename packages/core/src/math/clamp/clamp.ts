export const clamp = ({ min, value, max }: { min: number; value: number; max: number }) => {
  return Math.min(Math.max(value, min), max);
};
