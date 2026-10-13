import { computed, type Signal } from '@angular/core';
import type {
  Edge,
  EdgeRouting,
  EdgeRoutingContext,
  NgDiagramConfig,
  Point,
  PortSide,
} from 'ng-diagram';

export type LineJumpStyle = 'arc' | 'gap';

interface LineJumpsOptions {
  size?: number;
  style?: LineJumpStyle;
}

interface VerticalSegment {
  x: number;
  top: number;
  bottom: number;
}

/**
 * Orthogonal routing that draws a jump where a horizontal segment crosses
 * a vertical segment of any edge. Only the SVG path has the jumps:
 * the edge points stay orthogonal.
 */
export class LineJumpsRouting implements EdgeRouting {
  name = 'line-jumps';

  // The vertical segments of all edges, sorted by x, built once per model change.
  // `equal` skips the update when they stay the same (pan, zoom, selection).
  private readonly verticals: Signal<VerticalSegment[]>;

  // The jump options from the config, with defaults.
  // `equal` skips the update when another part of the config changes.
  readonly options: Signal<Required<LineJumpsOptions>>;

  // computeSvgPath reads verticals and options, so the edges redraw when they change.
  // The `config` parameter of computeSvgPath does not cause a redraw,
  // so the options come from the config signal.
  constructor(edges: Signal<Edge[]>, config: Signal<NgDiagramConfig>) {
    this.verticals = computed(() => collectVerticals(edges()), {
      equal: sameSegments,
    });
    this.options = computed(
      () => {
        const { size = 16, style = 'arc' } = (config().edgeRouting?.[
          'line-jumps'
        ] ?? {}) as LineJumpsOptions;
        return { size, style };
      },
      { equal: (a, b) => a.size === b.size && a.style === b.style }
    );
  }

  computePoints({ sourcePoint, targetPoint }: EdgeRoutingContext): Point[] {
    const source = { x: sourcePoint.x, y: sourcePoint.y };
    const target = { x: targetPoint.x, y: targetPoint.y };
    const sourceHorizontal = isHorizontal(sourcePoint.side);
    const targetHorizontal = isHorizontal(targetPoint.side);

    let corners: Point[];
    if (sourceHorizontal && targetHorizontal) {
      const midX = (source.x + target.x) / 2;
      corners = [
        { x: midX, y: source.y },
        { x: midX, y: target.y },
      ];
    } else if (!sourceHorizontal && !targetHorizontal) {
      const midY = (source.y + target.y) / 2;
      corners = [
        { x: source.x, y: midY },
        { x: target.x, y: midY },
      ];
    } else if (sourceHorizontal) {
      corners = [{ x: target.x, y: source.y }];
    } else {
      corners = [{ x: source.x, y: target.y }];
    }

    return removeCollinearPoints([source, ...corners, target]);
  }

  computeSvgPath(points: Point[]): string {
    if (points.length === 0) return '';

    const { size, style } = this.options();
    const radius = size / 2;
    const verticals = this.verticals();

    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const start = points[i - 1];
      const end = points[i];

      if (start.y === end.y) {
        const direction = Math.sign(end.x - start.x);
        const jumps: { from: number; to: number }[] = [];
        for (const x of findCrossings(start, end, verticals, radius)) {
          const from = x - direction * radius;
          const to = x + direction * radius;
          const last = jumps.at(-1);
          // Jumps that would overlap become one wider jump over all their crossings
          if (last && (from - last.to) * direction < 0) {
            last.to = to;
          } else {
            jumps.push({ from, to });
          }
        }
        for (const { from, to } of jumps) {
          path += ` L ${from},${start.y}`;
          // The arc keeps its height on a wider jump: only the x radius grows.
          // Sweep 1 turns clockwise: when moving right the arc goes up
          path +=
            style === 'gap'
              ? ` M ${to},${start.y}`
              : ` A ${Math.abs(to - from) / 2},${radius} 0 0 ${direction > 0 ? 1 : 0} ${to},${start.y}`;
        }
      }

      path += ` L ${end.x},${end.y}`;
    }

    return path;
  }

  // Places labels along the segments, not on a straight line between the ends
  computePointOnPath(points: Point[], percentage: number): Point {
    // The segments are horizontal or vertical, so dx + dy is their length
    const lengths = points
      .slice(1)
      .map((p, i) => Math.abs(p.x - points[i].x) + Math.abs(p.y - points[i].y));
    const total = lengths.reduce((sum, length) => sum + length, 0);
    let distance = total * Math.min(Math.max(percentage, 0), 1);

    for (let i = 0; i < lengths.length; i++) {
      if (distance <= lengths[i]) {
        const t = lengths[i] === 0 ? 0 : distance / lengths[i];
        return {
          x: points[i].x + (points[i + 1].x - points[i].x) * t,
          y: points[i].y + (points[i + 1].y - points[i].y) * t,
        };
      }
      distance -= lengths[i];
    }
    return points.at(-1) ?? { x: 0, y: 0 };
  }
}

function collectVerticals(edges: Edge[]): VerticalSegment[] {
  const segments: VerticalSegment[] = [];
  for (const { points, computedHidden } of edges) {
    if (computedHidden || !points) continue;
    for (let i = 1; i < points.length; i++) {
      const start = points[i - 1];
      const end = points[i];
      if (start.x === end.x) {
        segments.push({
          x: start.x,
          top: Math.min(start.y, end.y),
          bottom: Math.max(start.y, end.y),
        });
      }
    }
  }
  return segments.sort(
    (a, b) => a.x - b.x || a.top - b.top || a.bottom - b.bottom
  );
}

function sameSegments(a: VerticalSegment[], b: VerticalSegment[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (s, i) => s.x === b[i].x && s.top === b[i].top && s.bottom === b[i].bottom
    )
  );
}

/** X positions where the horizontal segment crosses the verticals, in the direction of the segment. */
function findCrossings(
  start: Point,
  end: Point,
  verticals: VerticalSegment[],
  radius: number
): number[] {
  // The margin keeps jumps off corners and line ends of both edges
  const minX = Math.min(start.x, end.x) + radius;
  const maxX = Math.max(start.x, end.x) - radius;
  const y = start.y;

  // The list is sorted by x, so only the segments between minX and maxX are checked
  const crossings: number[] = [];
  for (let i = firstIndexAfter(verticals, minX); i < verticals.length; i++) {
    const { x, top, bottom } = verticals[i];
    if (x >= maxX) break;
    if (y > top + radius && y < bottom - radius) crossings.push(x);
  }
  return end.x > start.x ? crossings : crossings.reverse();
}

/** Binary search: the index of the first segment with x greater than the given x. */
function firstIndexAfter(verticals: VerticalSegment[], x: number): number {
  let low = 0;
  let high = verticals.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (verticals[middle].x > x) {
      high = middle;
    } else {
      low = middle + 1;
    }
  }
  return low;
}

function removeCollinearPoints(points: Point[]): Point[] {
  const result: Point[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const previous = result[result.length - 1];
    const point = points[i];
    const next = points[i + 1];
    const sameX = previous.x === point.x && point.x === next.x;
    const sameY = previous.y === point.y && point.y === next.y;
    const duplicate = previous.x === point.x && previous.y === point.y;
    if (!sameX && !sameY && !duplicate) {
      result.push(point);
    }
  }
  result.push(points[points.length - 1]);
  return result;
}

function isHorizontal(side: PortSide): boolean {
  return side === 'left' || side === 'right';
}
