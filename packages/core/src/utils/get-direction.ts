import { LayoutAngleType } from '../types/tree-layout.interface.ts';

export const isAngleVertical = (angle: LayoutAngleType) => angle === 90 || angle == 270;

export const isAngleHorizontal = (angle: LayoutAngleType) => angle === 0 || angle == 180;

export const getSign = (angle: LayoutAngleType) => (angle === 0 || angle == 90 ? 1 : -1);
