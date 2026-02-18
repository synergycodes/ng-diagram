import type { InputModifiers } from '../input-events/input-events.interface';
import type { Edge } from './edge.interface';
import type { Node } from './node.interface';
import type { Point } from './utils';

/**
 * State tracking a node resize operation in progress.
 *
 * @public
 * @since 0.8.0
 * @category Internals
 */
export interface ResizeActionState {
  /** Initial width of the node before resize. */
  startWidth: number;
  /** Initial height of the node before resize. */
  startHeight: number;
  /** Initial X coordinate in screen space where the resize started. */
  startX: number;
  /** Initial Y coordinate in screen space where the resize started. */
  startY: number;
  /** Initial X position of the node in diagram space. */
  startNodePositionX: number;
  /** Initial Y position of the node in diagram space. */
  startNodePositionY: number;
  /** Reference to the node being resized. */
  resizingNode: Node;
}

/**
 * State tracking an edge creation operation in progress.
 *
 * @public
 * @since 0.8.0
 * @category Internals
 */
export interface LinkingActionState {
  /** ID of the node where the edge starts. */
  sourceNodeId: string;
  /** ID of the port where the edge starts. */
  sourcePortId: string;
  /** Temporary edge displayed while creating the connection. */
  temporaryEdge: Edge | null;
}

/**
 * State containing copied nodes and edges for paste operations.
 *
 * @public
 * @since 0.8.0
 * @category Internals
 */
export interface CopyPasteActionState {
  /** Array of nodes that were copied. */
  copiedNodes: Node[];
  /** Array of edges that were copied. */
  copiedEdges: Edge[];
}

/**
 * State tracking which group is currently highlighted.
 *
 * @public
 * @since 0.8.0
 * @category Internals
 */
export interface HighlightGroupActionState {
  /** ID of the highlighted group, or null if no group is highlighted. */
  highlightedGroupId: string | null;
}

/**
 * State tracking a node rotation operation in progress.
 *
 * @public
 * @since 0.8.0
 * @category Internals
 */
export interface RotationActionState {
  /** Angle in degrees at the start of the rotation operation. */
  startAngle: number;
  /** Initial angle of the node before rotation. */
  initialNodeAngle: number;
  /** ID of the node being rotated. */
  nodeId: string;
}

/**
 * State tracking a drag operation in progress.
 *
 * @public
 * @since 0.8.0
 * @category Internals
 */
export interface DraggingActionState {
  /** Input modifiers (e.g., Ctrl, Shift) active during the drag. */
  modifiers: InputModifiers;
  /**
   * Accumulated deltas per node that haven't yet resulted in a snap movement.
   * Key is node ID, value is the accumulated delta that hasn't been applied due to snapping.
   */
  accumulatedDeltas: Map<string, Point>;
  /**
   * Whether the pointer has moved beyond the move threshold, indicating an actual drag.
   * `false` when the drag state is first created (on pointer down), `true` once movement exceeds the threshold.
   */
  movementStarted: boolean;
}

/**
 * State tracking a panning operation in progress.
 *
 * @public
 * @since 1.0.0
 * @category Internals
 */
export interface PanningActionState {
  /** Whether panning is currently active. */
  active: boolean;
}

/**
 * Interface representing the current state of various user interactions in the diagram.
 *
 * This state is read-only and automatically managed by the library. It provides
 * information about active operations such as resizing, linking, dragging, and other
 * user interactions. Use this to observe the current state, not to modify it.
 *
 * @public
 * @since 0.8.0
 * @category Internals
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
  /**
   * State related to panning the viewport
   */
  panning?: PanningActionState;
}
