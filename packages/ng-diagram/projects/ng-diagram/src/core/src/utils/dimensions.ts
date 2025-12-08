import { Edge, Node, Rect } from '../types';
import { boundingRectOfPoints, getRect, unionRect } from './rects-points-sizes';

const calculateNodeBounds = (nodes: Node[]): Rect => {
  return unionRect(nodes.map((node) => node.measuredBounds).filter((rect): rect is Rect => rect !== undefined));
};

const calculateEdgeBounds = (edges: Edge[]): Rect => {
  return unionRect(edges.map(getEdgeMeasuredBounds));
};

export const calculatePartsBounds = (nodes: Node[], edges: Edge[]): Rect => {
  const nodeBounds = calculateNodeBounds(nodes);
  const edgeBounds = calculateEdgeBounds(edges);

  return unionRect([nodeBounds, edgeBounds]);
};

export const getEdgeMeasuredBounds = (edge: Edge): Rect => {
  const points = edge.points || [];
  const pointsBounds = boundingRectOfPoints(points);

  const labels = edge.measuredLabels || [];
  if (labels.length === 0) {
    return pointsBounds;
  }

  const labelRects = labels
    .filter((label) => label.position && label.size)
    .map((label) => getRect({ position: label.position, size: label.size }));

  return unionRect([pointsBounds, ...labelRects]);
};

export const getNodeMeasuredBounds = (node: Node): Rect => {
  const ports = node.measuredPorts || [];
  const { x, y, width, height } = getRect(node);
  const angle = ((node.angle || 0) * Math.PI) / 180;

  let leftOffset = 0;
  let rightOffset = 0;
  let topOffset = 0;
  let bottomOffset = 0;

  for (const port of ports) {
    const { x: px, y: py, width: pw, height: ph } = getRect(port);

    leftOffset = Math.min(leftOffset, px);
    rightOffset = Math.max(rightOffset, px + pw - width);
    topOffset = Math.min(topOffset, py);
    bottomOffset = Math.max(bottomOffset, py + ph - height);
  }

  const expandedX = x + leftOffset;
  const expandedY = y + topOffset;
  const expandedWidth = width + rightOffset - leftOffset;
  const expandedHeight = height + bottomOffset - topOffset;

  if (!node.angle || node.angle === 0) {
    return {
      x: expandedX,
      y: expandedY,
      width: expandedWidth,
      height: expandedHeight,
    };
  }

  const cx = expandedX + expandedWidth / 2;
  const cy = expandedY + expandedHeight / 2;

  const corners = [
    { x: expandedX, y: expandedY },
    { x: expandedX + expandedWidth, y: expandedY },
    { x: expandedX + expandedWidth, y: expandedY + expandedHeight },
    { x: expandedX, y: expandedY + expandedHeight },
  ];

  const rotated = corners.map(({ x, y }) => {
    const dx = x - cx;
    const dy = y - cy;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: cx + dx * cos - dy * sin,
      y: cy + dx * sin + dy * cos,
    };
  });

  const minX = Math.min(...rotated.map((p) => p.x));
  const maxX = Math.max(...rotated.map((p) => p.x));
  const minY = Math.min(...rotated.map((p) => p.y));
  const maxY = Math.max(...rotated.map((p) => p.y));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};
