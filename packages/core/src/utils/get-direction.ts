export const isAngleVertical = (angle: 0 | 90 | 180 | 270) => angle === 90 || angle == 270;

export const isAngleHorizontal = (angle: 0 | 90 | 180 | 270) => angle === 0 || angle == 180;

export const getSign = (angle: 0 | 90 | 180 | 270) => (angle === 0 || angle == 90 ? 1 : -1);
