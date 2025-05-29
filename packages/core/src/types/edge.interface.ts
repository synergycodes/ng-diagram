import type { Point, Size } from './utils';

/**
 * Interface representing an edge (connection) between nodes in the flow diagram
 */
export interface Edge {
  /**
   * The unique identifier for the edge.
   */
  id: string;
  /**
   * The source node of the edge. If empty string it will use sourcePosition.
   */
  source: string;
  /**
   * The target node of the edge. If empty string it will use targetPosition.
   */
  target: string;
  /**
   * The data associated with the edge.
   */
  data: Record<string, unknown>;
  /**
   * The points of the edge defining the path.
   */
  points?: Point[];
  /**
   * Whether the edge is selected
   */
  selected?: boolean;
  /**
   * The type of the edge declared in edgeTemplateMap.
   */
  type?: string;
  /**
   * The port of the source node.
   */
  sourcePort?: string;
  /**
   * The port of the target node.
   */
  targetPort?: string;
  /**
   * The id of the source arrowhead of the edge.
   */
  sourceArrowhead?: string;
  /**
   * The id of the target arrowhead of the edge.
   */
  targetArrowhead?: string;
  /**
   * The routing of the edge.
   */
  routing?: string;
  /**
   * The position of the edge start.
   */
  sourcePosition?: Point;
  /**
   * The position of the edge end.
   */
  targetPosition?: Point;
  /**
   * Whether the edge is temporary.
   */
  temporary?: boolean;
  /**
   * The z-order of the edge.
   */
  zOrder?: number;
  /**
   * The labels of the edge.
   */
  labels?: EdgeLabel[];
}

/**
 * Interface representing a label of an edge.
 */
export interface EdgeLabel {
  /**
   * The id of the label.
   */
  id: string;
  /**
   * The position of the label from 0 to 1 where 0 is the source position of edge and 1 is the target position of edge.
   */
  positionOnEdge: number;
  /**
   * The position of the label on flow.
   */
  position?: Point;
  /**
   * The size of the label.
   */
  size?: Size;
}
