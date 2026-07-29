import { EdgeRoutingConfig, Point, PortLocation, PortSide } from '../../../types';
import { EdgeRouting, EdgeRoutingContext } from '../../types';
import { computeBezierPath } from '../bezier/compute-bezier-path';
import { computeBezierPointAtDistance } from '../bezier/compute-bezier-point-at-distance';
import { computeBezierPointOnPath } from '../bezier/compute-bezier-point-on-path';

const LOOP_SIZE_FALLBACK = 50;
const LOOP_SPREAD_FALLBACK = 30;
const LOOP_SIZE_INCREMENT_FALLBACK = 25;
const DEFAULT_SIDE_FALLBACK: PortSide = 'top';
const SIDES: PortSide[] = ['top', 'right', 'bottom', 'left'];

function getRotatedSide(baseSide: PortSide, index: number): PortSide {
  const baseIndex = SIDES.indexOf(baseSide);
  if (baseIndex === -1) return baseSide;
  const normalizedIndex = ((index % SIDES.length) + SIDES.length) % SIDES.length;
  return SIDES[(baseIndex + normalizedIndex) % SIDES.length];
}

function getSideForLoop(context: EdgeRoutingContext, defaultSide: PortSide): PortSide {
  const sourcePortSide = context.sourcePort?.side;
  const targetPortSide = context.targetPort?.side;
  const sourcePointSide = context.sourcePoint.side;

  if (sourcePortSide && sourcePortSide === targetPortSide) return sourcePortSide;
  if (sourcePortSide) return sourcePortSide;
  if (targetPortSide) return targetPortSide;
  if (sourcePointSide) return sourcePointSide;
  return defaultSide;
}

function getSelfLoopPoints(
  sourcePoint: PortLocation,
  targetPoint: PortLocation,
  loopSide: PortSide,
  loopSize: number,
  loopSpread: number
): Point[] {
  const centerX = (sourcePoint.x + targetPoint.x) / 2;
  const centerY = (sourcePoint.y + targetPoint.y) / 2;
  const halfSpread = loopSpread / 2;

  switch (loopSide) {
    case 'right':
      return [
        { x: centerX, y: centerY - halfSpread },
        { x: centerX + loopSize, y: centerY - halfSpread },
        { x: centerX + loopSize, y: centerY + halfSpread },
        { x: centerX, y: centerY + halfSpread },
      ];
    case 'bottom':
      return [
        { x: centerX + halfSpread, y: centerY },
        { x: centerX + halfSpread, y: centerY + loopSize },
        { x: centerX - halfSpread, y: centerY + loopSize },
        { x: centerX - halfSpread, y: centerY },
      ];
    case 'left':
      return [
        { x: centerX, y: centerY + halfSpread },
        { x: centerX - loopSize, y: centerY + halfSpread },
        { x: centerX - loopSize, y: centerY - halfSpread },
        { x: centerX, y: centerY - halfSpread },
      ];
    case 'top':
    default:
      return [
        { x: centerX - halfSpread, y: centerY },
        { x: centerX - halfSpread, y: centerY - loopSize },
        { x: centerX + halfSpread, y: centerY - loopSize },
        { x: centerX + halfSpread, y: centerY },
      ];
  }
}

export class SelfLoopRouting implements EdgeRouting {
  name = 'self-loop';

  computePoints(context: EdgeRoutingContext, config?: EdgeRoutingConfig): Point[] {
    const loopSize = config?.selfLoop?.loopSize ?? LOOP_SIZE_FALLBACK;
    const loopSpread = config?.selfLoop?.loopSpread ?? LOOP_SPREAD_FALLBACK;
    const loopSizeIncrement = config?.selfLoop?.sizeIncrement ?? LOOP_SIZE_INCREMENT_FALLBACK;
    const defaultSide = config?.selfLoop?.defaultSide ?? DEFAULT_SIDE_FALLBACK;
    const selfLoopIndex = context.selfLoopIndex ?? 0;

    const baseSide = getSideForLoop(context, defaultSide);
    const loopSide = getRotatedSide(baseSide, selfLoopIndex);
    const computedLoopSize = Math.max(0, loopSize + selfLoopIndex * loopSizeIncrement);
    const computedLoopSpread = Math.max(1, loopSpread + selfLoopIndex * 8);

    return getSelfLoopPoints(context.sourcePoint, context.targetPoint, loopSide, computedLoopSize, computedLoopSpread);
  }

  computeSvgPath(points: Point[]): string {
    return computeBezierPath(points);
  }

  computePointOnPath(points: Point[], percentage: number): Point {
    return computeBezierPointOnPath(points, percentage);
  }

  computePointAtDistance(points: Point[], distancePx: number): Point {
    return computeBezierPointAtDistance(points, distancePx);
  }
}
