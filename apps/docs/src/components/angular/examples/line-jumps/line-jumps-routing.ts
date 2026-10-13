import type { Signal } from '@angular/core';
import type {
  Edge,
  EdgeRouting,
  EdgeRoutingConfig,
  EdgeRoutingContext,
  Point,
  PortSide,
} from 'ng-diagram';

type JumpStyle = 'arc' | 'gap';

interface Segment {
  start: Point;
  end: Point;
}

const DEFAULT_JUMP_SIZE = 16;

/**
 * Orthogonal routing that draws a jump where a horizontal segment crosses
 * a vertical segment of any edge. Only the SVG path has the jumps:
 * the edge points stay orthogonal.
 */
export class LineJumpsRouting implements EdgeRouting {
  name = 'line-jumps';

  // computeSvgPath reads this signal inside the edge's path computed,
  // so every edge redraws its jumps when any edge changes.
  constructor(private readonly edges: Signal<Edge[]>) {}

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

  computeSvgPath(points: Point[], config?: EdgeRoutingConfig): string {
    if (points.length === 0) return '';

    const { size, style } = readOptions(config);
    const radius = size / 2;
    const verticals = this.verticalSegments();

    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const start = points[i - 1];
      const end = points[i];

      if (start.y === end.y && start.x !== end.x) {
        const direction = Math.sign(end.x - start.x);
        // A jump closer than its own size to the previous one would overlap it
        let previousX: number | undefined;
        for (const x of findCrossings(start, end, verticals, radius)) {
          if (previousX !== undefined && Math.abs(x - previousX) < size) {
            continue;
          }
          const before = x - direction * radius;
          const after = x + direction * radius;
          path += ` L ${before},${start.y}`;
          // Sweep 1 turns clockwise: when moving right the arc goes up
          path +=
            style === 'gap'
              ? ` M ${after},${start.y}`
              : ` A ${radius},${radius} 0 0 ${direction > 0 ? 1 : 0} ${after},${start.y}`;
          previousX = x;
        }
      }

      path += ` L ${end.x},${end.y}`;
    }

    return path;
  }

  private verticalSegments(): Segment[] {
    const segments: Segment[] = [];
    for (const edge of this.edges()) {
      const points = edge.points ?? [];
      if (edge.computedHidden) continue;
      for (let i = 1; i < points.length; i++) {
        const start = points[i - 1];
        const end = points[i];
        if (start.x === end.x && start.y !== end.y) {
          segments.push({ start, end });
        }
      }
    }
    return segments;
  }
}

/** X positions where the horizontal segment crosses the verticals, in the direction of the segment. */
function findCrossings(
  start: Point,
  end: Point,
  verticals: Segment[],
  radius: number
): number[] {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const y = start.y;

  // The margin keeps jumps off corners and line ends of both edges
  const crossings = verticals
    .filter(({ start: a, end: b }) => {
      const minY = Math.min(a.y, b.y);
      const maxY = Math.max(a.y, b.y);
      return (
        a.x > minX + radius &&
        a.x < maxX - radius &&
        y > minY + radius &&
        y < maxY - radius
      );
    })
    .map(({ start: a }) => a.x);

  return [...new Set(crossings)].sort((a, b) =>
    end.x > start.x ? a - b : b - a
  );
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

function readOptions(config?: EdgeRoutingConfig): {
  size: number;
  style: JumpStyle;
} {
  const options = config?.['line-jumps'];
  if (typeof options !== 'object') {
    return { size: DEFAULT_JUMP_SIZE, style: 'arc' };
  }
  return {
    size:
      typeof options['size'] === 'number' ? options['size'] : DEFAULT_JUMP_SIZE,
    style: options['style'] === 'gap' ? 'gap' : 'arc',
  };
}
