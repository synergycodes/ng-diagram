import { RoutingName } from '../../routing-manager';
import { Point } from '../../types';

export type GetPointOnPathOptions = GetPointOnPathImplementationOptions & {
  routing?: RoutingName;
};

export type GetPointOnPathImplementation = (options: GetPointOnPathImplementationOptions) => Point;

export interface GetPointOnPathImplementationOptions {
  points: Point[];
  percentage: number;
}
