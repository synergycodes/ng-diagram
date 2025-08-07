import type { Edge } from './edge.interface';
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

export interface CopyPasteActionState {
  copiedNodes: Node[];
  copiedEdges: Edge[];
}

export interface HighlightGroupActionState {
  highlightedGroupId: string | null;
}

export interface RotationActionState {
  startAngle: number;
  initialNodeAngle: number;
  nodeId: string;
}

export interface ActionState {
  resize?: ResizeActionState;
  linking?: LinkingActionState;
  copyPaste?: CopyPasteActionState;
  highlightGroup?: HighlightGroupActionState;
  rotation?: RotationActionState;
}
