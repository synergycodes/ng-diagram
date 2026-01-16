import { FlowCore } from '../flow-core';
import { Node, Point, Port, Rect } from '../types';
import { doesContainRect, getDistanceBetweenRects, getPointRangeRect, getRect } from '../utils';
import { getNodeMeasuredBounds } from '../utils/dimensions';
import { checkCollision } from './collision-detection';

export const getNodesInRange = (flowCore: FlowCore, point: Point, range: number): Node[] => {
  const rangeRect = getPointRangeRect(point, range);
  const candidateIds = flowCore.spatialHash.queryIds(rangeRect);
  const foundNodes: Node[] = [];
  for (const nodeId of candidateIds) {
    const node = flowCore.modelLookup.getNodeById(nodeId);
    if (node && checkCollision(rangeRect, node)) {
      foundNodes.push(node);
    }
  }
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
  const candidateIds = flowCore.spatialHash.queryIds(rect);
  const foundNodes: Node[] = [];

  for (const nodeId of candidateIds) {
    const node = flowCore.modelLookup.getNodeById(nodeId);
    if (node && checkCollision(rect, node)) {
      foundNodes.push(node);
    }
  }

  if (partialInclusion) {
    return foundNodes;
  }

  const fullyContainedNodes = foundNodes.filter((node) => {
    const nodeRect = getRect(node);
    return doesContainRect(rect, nodeRect);
  });

  return fullyContainedNodes;
};

export function getOverlappingNodes(flowCore: FlowCore, nodeId: string): Node[];
export function getOverlappingNodes(flowCore: FlowCore, node: Node): Node[];
export function getOverlappingNodes(flowCore: FlowCore, nodeOrId: Node | string): Node[] {
  const isNodeId = typeof nodeOrId === 'string';
  const targetNode = isNodeId ? flowCore.modelLookup.getNodeById(nodeOrId) : nodeOrId;

  if (!targetNode) {
    return [];
  }

  // When a node object is passed, always compute fresh bounds - edge case if it is used
  // inside a middleware, measuredBounds may be obsolete
  const measuredBounds = isNodeId
    ? (targetNode.measuredBounds ?? getNodeMeasuredBounds(targetNode))
    : getNodeMeasuredBounds(targetNode);

  const foundNodesIds = flowCore.spatialHash.queryIds(measuredBounds);
  const foundNodes: Node[] = [];

  for (const candidateNodeId of foundNodesIds) {
    if (candidateNodeId === targetNode.id) continue;

    const candidateNode = flowCore.modelLookup.getNodeById(candidateNodeId);
    if (candidateNode && checkCollision(targetNode, candidateNode)) {
      foundNodes.push(candidateNode);
    }
  }

  return foundNodes;
}
