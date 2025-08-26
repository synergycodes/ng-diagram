import { EdgeRoutingName } from '../edge-routing-manager/types';
import { Point, Size } from './utils';

export type RoutingMode = 'manual' | 'auto';

/**
 * Interface representing an edge (connection) between nodes in the flow diagram
 * @category Types
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Edge<T = any> {
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
  data: T;
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
  routing?: EdgeRoutingName;
  /**
   * The routing mode of the edge.
   * 'auto' (default): Points are computed automatically based on routing algorithm
   * 'manual': Points are provided by the user and routing algorithm is used to render the path
   */
  routingMode?: RoutingMode;
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
   * The z-index of the node. This value is set automatically
   */
  zIndex?: number;
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
