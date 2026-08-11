import { Point } from '../../types/utils';

/** Vector difference `a - b` — e.g. the movement delta from point `b` to point `a`. */
export const subtractPoints = (a: Point, b: Point): Point => {
  return { x: a.x - b.x, y: a.y - b.y };
};
