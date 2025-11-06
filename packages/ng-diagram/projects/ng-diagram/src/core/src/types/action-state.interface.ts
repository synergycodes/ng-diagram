import type { InputModifiers } from '../input-events/input-events.interface';
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
  temporaryEdge: Edge | null;
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

export interface DraggingActionState {
  modifiers: InputModifiers;
}

/**
 * Interface representing the current state of various user actions in the flow diagram
 *
 * @category Types/Middleware
 */
export interface ActionState {
  /**
   * State related to node resizing action
   */
  resize?: ResizeActionState;
  /**
   * State related to linking nodes
   */
  linking?: LinkingActionState;
  /**
   * State related to copy-paste actions
   */
  copyPaste?: CopyPasteActionState;
  /**
   * State related to highlighting groups
   */
  highlightGroup?: HighlightGroupActionState;
  /**
   * State related to node rotation
   */
  rotation?: RotationActionState;
  /**
   * State related to dragging elements
   */
  dragging?: DraggingActionState;
}
