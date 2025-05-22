import { FlowCore } from '../flow-core';
import { Node, Port, Rect } from '../types';

const getPointRangeRect = (point: { x: number; y: number }, range: number): Rect => {
  return {
    x: point.x - range,
    y: point.y - range,
    width: range * 2,
    height: range * 2,
  };
};

export const getRect = ({
  position = { x: 0, y: 0 },
  size = { width: 1, height: 1 },
}: {
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}): Rect => {
  return {
    x: position?.x || 0,
    y: position?.y || 0,
    width: size?.width || 1,
    height: size?.height || 1,
  };
};

export const doesRectsIntersect = (rect1: Rect, rect2: Rect): boolean => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

export const getDistanceBetweenRects = (rect1: Rect, rect2: Rect): number => {
  if (doesRectsIntersect(rect1, rect2)) {
    return 0;
  }
  const rect1Right = rect1.x + rect1.width;
  const rect1Bottom = rect1.y + rect1.height;
  const rect2Right = rect2.x + rect2.width;
  const rect2Bottom = rect2.y + rect2.height;

  if (rect1Right <= rect2.x) {
    if (rect1Bottom <= rect2.y) {
      return Math.sqrt((rect1Right - rect2.x) ** 2 + (rect1Bottom - rect2.y) ** 2);
    }
    if (rect1.y >= rect2Bottom) {
      return Math.sqrt((rect1Right - rect2.x) ** 2 + (rect1.y - rect2Bottom) ** 2);
    }
    return rect2.x - rect1Right;
  }

  if (rect1.x >= rect2Right) {
    if (rect1Bottom <= rect2.y) {
      return Math.sqrt((rect1.x - rect2Right) ** 2 + (rect1Bottom - rect2.y) ** 2);
    }
    if (rect1.y >= rect2Bottom) {
      return Math.sqrt((rect1.x - rect2Right) ** 2 + (rect1.y - rect2Bottom) ** 2);
    }
    return rect1.x - rect2Right;
  }

  if (rect1Bottom <= rect2.y) {
    return rect2.y - rect1Bottom;
  }
  if (rect1.y >= rect2Bottom) {
    return rect1.y - rect2Bottom;
  }
  const center1 = {
    x: rect1.x + rect1.width / 2,
    y: rect1.y + rect1.height / 2,
  };
  const center2 = {
    x: rect2.x + rect2.width / 2,
    y: rect2.y + rect2.height / 2,
  };
  return Math.sqrt((center1.x - center2.x) ** 2 + (center1.y - center2.y) ** 2);
};

export const getNodesInRange = (flowCore: FlowCore, point: { x: number; y: number }, range: number): Node[] => {
  const foundNodesIds = new Set(flowCore.spatialHash.query(getPointRangeRect(point, range)).map(({ id }) => id));
  const foundNodes: Node[] = [];
  flowCore.getState().nodes.forEach((node) => {
    if (foundNodesIds.has(node.id)) {
      foundNodes.push(node);
    }
  });
  return foundNodes;
};

export const getNearestNodeInRange = (
  flowCore: FlowCore,
  point: { x: number; y: number },
  range: number
): Node | null => {
  return (
    getNodesInRange(flowCore, point, range).sort((a, b) => {
      const aDistance = getDistanceBetweenRects(getRect(a), getPointRangeRect(point, range));
      const bDistance = getDistanceBetweenRects(getRect(b), getPointRangeRect(point, range));
      return aDistance - bDistance;
    })[0] || null
  );
};

export const getNearestPortInRange = (
  flowCore: FlowCore,
  point: { x: number; y: number },
  range: number
): Port | null => {
  const nodeToPortsMap = new Map<Node, Port[]>();
  getNodesInRange(flowCore, point, range).forEach((node) => {
    nodeToPortsMap.set(node, node.ports || []);
  });
  let minDistance = Infinity;
  let nearestPort: Port | null = null;
  for (const [node, ports] of nodeToPortsMap.entries()) {
    for (const port of ports) {
      const distance = getDistanceBetweenRects(
        getRect({
          size: port.size,
          position: { x: port.position.x + node.position.x, y: port.position.y + node.position.y },
        }),
        getPointRangeRect(point, range)
      );
      if (distance <= range) {
        if (distance < minDistance) {
          minDistance = distance;
          nearestPort = port;
        }
      }
    }
  }

  return nearestPort;
};
