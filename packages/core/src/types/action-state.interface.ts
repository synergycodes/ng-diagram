import type { Node } from './node.interface';

export interface ResizeActionState {
  startWidth: number;
  startHeight: number;
  startX: number;
  startY: number;
  startNodePositionX: number;
  startNodePositionY: number;
  draggingNode: Node;
}

export interface LinkingActionState {
  sourceNodeId: string;
  sourcePortId: string;
}

export interface ActionState {
  resize?: ResizeActionState;
  linking?: LinkingActionState;
}
