import { NgDiagramMath } from '../math';
import type { FlowConfig, Node, Point } from '../types';

export const snapNodePosition = (config: FlowConfig, node: Node, position: Point): Point => {
  if (!config.snapping.shouldSnapDragForNode(node)) {
    return position;
  }

  const snap = config.snapping.computeSnapForNodeDrag(node) ?? config.snapping.defaultDragSnap;
  return NgDiagramMath.snapPoint(position, snap);
};
