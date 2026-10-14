import { computed, type Signal } from '@angular/core';
import type {
  Edge,
  EdgeRouting,
  EdgeRoutingContext,
  NgDiagramConfig,
  Point,
  PortLocation,
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

// The length of the first and last segment, out of the port
const STUB_LENGTH = 20;
// The vertical segments are split into columns of this width
const COLUMN_WIDTH = 400;

/**
 * Orthogonal routing that draws a jump where a horizontal segment crosses
 * a vertical segment of another edge with this routing. Only the SVG path
 * has the jumps: the edge points stay orthogonal.
 */
export class LineJumpsRouting implements EdgeRouting {
  name = 'line-jumps';

  // The vertical segments of all edges, sorted by x, built once per model change.
  // `equal` skips the update when they stay the same (pan, zoom, selection).
  private readonly verticals: Signal<VerticalSegment[]>;

  // One signal per column of the diagram. An edge reads only the columns
  // under its horizontal segments, so it redraws only when they change.
  private readonly columns = new Map<number, Signal<VerticalSegment[]>>();

  // The jump options from the config, with defaults.
  // `equal` skips the update when another part of the config changes.
  readonly options: Signal<Required<LineJumpsOptions>>;

  // computeSvgPath reads the columns and options, so the edges redraw when they change.
  // The `config` parameter of computeSvgPath does not cause a redraw,
  // so the options come from the config signal.
  constructor(edges: Signal<Edge[]>, config: Signal<NgDiagramConfig>) {
    this.verticals = computed(() => collectVerticals(edges(), this.name), {
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
    const sourceStub = moveOut(sourcePoint);
    const targetStub = moveOut(targetPoint);
    const midX = (sourceStub.x + targetStub.x) / 2;
    const midY = (sourceStub.y + targetStub.y) / 2;

    const routes = [
      [
        { x: midX, y: sourceStub.y },
        { x: midX, y: targetStub.y },
      ],
      [
        { x: sourceStub.x, y: midY },
        { x: targetStub.x, y: midY },
      ],
      [{ x: targetStub.x, y: sourceStub.y }],
      [{ x: sourceStub.x, y: targetStub.y }],
    ].map((corners) => [source, sourceStub, ...corners, targetStub, target]);

    // The route with the fewest corners that does not turn back into its own node
    const valid = routes
      .filter((route) => !turnsBack(route))
      .map(removeCollinearPoints);
    if (valid.length === 0) return removeCollinearPoints(routes[0]);
    return valid.reduce((best, route) =>
      route.length < best.length ? route : best
    );
  }

  computeSvgPath(points: Point[]): string {
    if (points.length === 0) return '';

    const { size, style } = this.options();
    const radius = size / 2;

    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const start = points[i - 1];
      const end = points[i];

      if (start.y === end.y) {
        const direction = Math.sign(end.x - start.x);
        const jumps: { from: number; to: number }[] = [];
        for (const x of this.findCrossings(start, end, radius)) {
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

  /** X positions where the horizontal segment crosses vertical segments, in the direction of the segment. */
  private findCrossings(start: Point, end: Point, radius: number): number[] {
    // The margin keeps jumps off corners and line ends of both edges
    const minX = Math.min(start.x, end.x) + radius;
    const maxX = Math.max(start.x, end.x) - radius;
    if (minX >= maxX) return [];

    // The columns are in x order and each column is sorted by x
    const crossings: number[] = [];
    const last = Math.floor(maxX / COLUMN_WIDTH);
    for (
      let column = Math.floor(minX / COLUMN_WIDTH);
      column <= last;
      column++
    ) {
      for (const { x, top, bottom } of this.column(column)()) {
        if (x <= minX || x >= maxX) continue;
        if (start.y > top + radius && start.y < bottom - radius) {
          crossings.push(x);
        }
      }
    }
    return end.x > start.x ? crossings : crossings.reverse();
  }

  // Creates the column signal on first use. The map keeps one entry
  // per column the diagram has used, which is small for any diagram size.
  private column(index: number): Signal<VerticalSegment[]> {
    let column = this.columns.get(index);
    if (!column) {
      const left = index * COLUMN_WIDTH;
      column = computed(
        () => {
          const verticals = this.verticals();
          return verticals.slice(
            firstIndexFrom(verticals, left),
            firstIndexFrom(verticals, left + COLUMN_WIDTH)
          );
        },
        { equal: sameSegments }
      );
      this.columns.set(index, column);
    }
    return column;
  }
}

// Edges with another routing are skipped: their points can be off the drawn line
function collectVerticals(edges: Edge[], routing: string): VerticalSegment[] {
  const segments: VerticalSegment[] = [];
  for (const edge of edges) {
    const { points, computedHidden } = edge;
    // Edges without `routing` use the default routing, which is this one in the example
    if (computedHidden || !points || (edge.routing ?? routing) !== routing) {
      continue;
    }
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

/** Binary search: the index of the first segment with x greater than or equal to the given x. */
function firstIndexFrom(verticals: VerticalSegment[], x: number): number {
  let low = 0;
  let high = verticals.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (verticals[middle].x >= x) {
      high = middle;
    } else {
      low = middle + 1;
    }
  }
  return low;
}

/** The point a short distance out of the port, in the direction of its side. */
function moveOut({ x, y, side }: PortLocation): Point {
  switch (side) {
    case 'left':
      return { x: x - STUB_LENGTH, y };
    case 'right':
      return { x: x + STUB_LENGTH, y };
    case 'top':
      return { x, y: y - STUB_LENGTH };
    case 'bottom':
      return { x, y: y + STUB_LENGTH };
  }
}

/** True when the line goes straight back the way it came, for example into its own node. */
function turnsBack(points: Point[]): boolean {
  let previous: Point | undefined;
  for (let i = 1; i < points.length; i++) {
    const direction = {
      x: Math.sign(points[i].x - points[i - 1].x),
      y: Math.sign(points[i].y - points[i - 1].y),
    };
    if (direction.x === 0 && direction.y === 0) continue;
    if (
      previous &&
      direction.x === -previous.x &&
      direction.y === -previous.y
    ) {
      return true;
    }
    previous = direction;
  }
  return false;
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
