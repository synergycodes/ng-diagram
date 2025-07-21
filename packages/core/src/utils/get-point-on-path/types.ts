import { Point, Routing } from '../../types';

export type GetPointOnPathOptions = GetPointOnPathImplementationOptions & {
  routing?: Routing;
};

export type GetPointOnPathImplementation = (options: GetPointOnPathImplementationOptions) => Point;

export interface GetPointOnPathImplementationOptions {
  points: Point[];
  percentage: number;
}
