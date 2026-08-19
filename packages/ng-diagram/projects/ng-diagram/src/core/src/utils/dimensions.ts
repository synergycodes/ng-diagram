import { Edge, Node, Rect } from '../types';
import { boundingRectOfPoints, getRect, getRotatedBoundingRect, unionRect } from './rects-points-sizes';

const calculateNodeBounds = (nodes: Node[]): Rect | null => {
  return unionRect(nodes.map((node) => node.measuredBounds).filter((rect): rect is Rect => rect !== undefined));
};

const calculateEdgeBounds = (edges: Edge[]): Rect | null => {
  return unionRect(edges.filter((edge) => edge.points?.length).map(getEdgeMeasuredBounds));
};

export const calculatePartsBounds = (nodes: Node[], edges: Edge[]): Rect | null => {
  const partsBounds = [calculateNodeBounds(nodes), calculateEdgeBounds(edges)].filter(
    (rect): rect is Rect => rect !== null
  );

  return unionRect(partsBounds);
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
    .map((label) => ({
      x: label.position!.x - label.size!.width / 2,
      y: label.position!.y - label.size!.height / 2,
      width: label.size!.width,
      height: label.size!.height,
    }));

  return unionRect([pointsBounds, ...labelRects]);
};

export const getNodeMeasuredBounds = (node: Node): Rect => {
  const ports = node.measuredPorts || [];
  const { x, y, width, height } = getRect(node);

  const localNodeRect = { x: 0, y: 0, width, height };
  const rotatedLocalRect = getRotatedBoundingRect(localNodeRect, node.angle || 0);

  const portRects = ports.map((port) => {
    const { x: px, y: py, width: pw, height: ph } = getRect(port);
    return { x: px, y: py, width: pw, height: ph };
  });

  const localBounds = unionRect([rotatedLocalRect, ...portRects]);

  return {
    x: x + localBounds.x,
    y: y + localBounds.y,
    width: localBounds.width,
    height: localBounds.height,
  };
};
