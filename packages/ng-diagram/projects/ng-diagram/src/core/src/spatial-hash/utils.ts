import { FlowCore } from '../flow-core';
import { Node, Point, Port, Rect } from '../types';
import { doesContainRect, getDistanceBetweenRects, getPointRangeRect, getRect } from '../utils';

export const getNodesInRange = (flowCore: FlowCore, point: Point, range: number): Node[] => {
  const foundNodesIds = new Set(flowCore.spatialHash.queryIds(getPointRangeRect(point, range)));
  const foundNodes: Node[] = [];
  flowCore.getState().nodes.forEach((node) => {
    if (foundNodesIds.has(node.id)) {
      foundNodes.push(node);
    }
  });
  return foundNodes;
};

export const getNearestNodeInRange = (flowCore: FlowCore, point: Point, range: number): Node | null => {
  return (
    getNodesInRange(flowCore, point, range).sort((a, b) => {
      const aDistance = getDistanceBetweenRects(getRect(a), getPointRangeRect(point, 1));
      const bDistance = getDistanceBetweenRects(getRect(b), getPointRangeRect(point, 1));
      return aDistance - bDistance;
    })[0] || null
  );
};

export const getNearestPortInRange = (flowCore: FlowCore, point: Point, range: number): Port | null => {
  const nodeToPortsMap = new Map<Node, Port[]>();
  getNodesInRange(flowCore, point, range).forEach((node) => {
    nodeToPortsMap.set(node, node.measuredPorts || []);
  });
  let minDistance = Infinity;
  let nearestPort: Port | null = null;
  for (const [node, ports] of nodeToPortsMap.entries()) {
    for (const port of ports) {
      const { x: px, y: py } = getRect(port);
      const distance = getDistanceBetweenRects(
        getRect({
          size: port.size,
          position: { x: px + node.position.x, y: py + node.position.y },
        }),
        getPointRangeRect(point, 1)
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

export const getNodesInRect = (flowCore: FlowCore, rect: Rect, partialInclusion = true): Node[] => {
  const foundNodesIds = new Set(flowCore.spatialHash.queryIds(rect));
  const foundNodes: Node[] = [];
  const nodes = flowCore.getState().nodes;

  nodes.forEach((node) => {
    if (foundNodesIds.has(node.id)) {
      foundNodes.push(node);
    }
  });

  if (partialInclusion) {
    return foundNodes;
  }

  const fullyContainedNodes = foundNodes.filter((node) => {
    const nodeRect = getRect(node);
    return doesContainRect(rect, nodeRect);
  });

  return fullyContainedNodes;
};
