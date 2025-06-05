export const normalizeAngle = (angle: number): number => {
  return (angle + 360) % 360;
};
