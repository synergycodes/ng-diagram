import { EdgeRoutingName } from '../edge-routing-manager/types';
import { DataObject, Point, Size } from './utils';

/**
 * Type representing edge routing mode
 *
 * @public
 * @since 0.8.0
 * @category Types/Routing
 */
export type RoutingMode = 'manual' | 'auto';

/**
 * Interface representing an edge (connection) between nodes in the flow diagram
 *
 * @public
 * @since 0.8.0
 * @category Types/Model
 */
export interface Edge<T extends DataObject = DataObject> {
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
   * @readonly
   * @remarks ComputedZIndex is computed by the system and should not be set manually.
   * The z-index of the node. This value is set automatically
   */
  readonly computedZIndex?: number;
  /**
   * @readonly
   * @remarks MeasuredLabels are computed by the system and should not be set manually.
   * The labels of the edge with computed position and size.
   */
  readonly measuredLabels?: EdgeLabel[];
}

/**
 * Type representing an absolute edge label position in pixels.
 * Positive values measure from the source, negative from the target.
 *
 * @example `'30px'` — 30px from source, `'-20px'` — 20px from target
 *
 * @public
 * @since 1.1.0
 * @category Types/Model
 */
export type AbsoluteEdgeLabelPosition = `${number}px`;

/**
 * Type representing edge label position — either relative (0-1) or absolute (`'Npx'`).
 *
 * - **Relative** (`number`, 0-1): percentage along the path. Clamped to [0, 1].
 * - **Absolute** (`string`, `'Npx'`): pixel distance from source (positive) or target (negative). Clamped to path length.
 *
 * @public
 * @since 1.1.0
 * @category Types/Model
 */
export type EdgeLabelPosition = number | AbsoluteEdgeLabelPosition;

/**
 * Interface representing a label of an edge.
 *
 * @public
 * @since 0.8.0
 * @category Types/Model
 */
export interface EdgeLabel {
  /**
   * The id of the label.
   */
  id: string;
  /**
   * The position of the label on the edge.
   *
   * - **Relative** (`number`, 0-1): 0 is the source, 1 is the target, 0.5 is the midpoint.
   * - **Absolute** (`'Npx'`): pixel distance from source (positive) or target (negative).
   *
   * @example
   * ```ts
   * positionOnEdge: 0.5      // midpoint (relative)
   * positionOnEdge: '30px'   // 30px from source (absolute)
   * positionOnEdge: '-20px'  // 20px from target (absolute)
   * ```
   */
  positionOnEdge: EdgeLabelPosition;
  /**
   * The position of the label on flow.
   */
  position?: Point;
  /**
   * The size of the label.
   */
  size?: Size;
}

/**
 * The origin point options for port placement.
 * @category Types/Model
 */
export type OriginPoint =
  | 'topLeft'
  | 'topCenter'
  | 'topRight'
  | 'centerLeft'
  | 'center'
  | 'centerRight'
  | 'bottomLeft'
  | 'bottomCenter'
  | 'bottomRight';
