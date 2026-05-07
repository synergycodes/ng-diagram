import type { DataObject, Point, PortSide, Rect, Size } from './utils';

/**
 * Interface representing all possible node types in the diagram
 *
 * @public
 * @since 0.8.0
 * @category Types/Model
 */

export type Node<T extends DataObject = DataObject> = SimpleNode<T> | GroupNode<T>;

/**
 * Interface representing a group node in the diagram
 *
 * @public
 * @since 0.8.0
 * @category Types/Model
 */

export interface GroupNode<T extends DataObject = DataObject> extends SimpleNode<T> {
  /**
   * Flag indicating the node is a group
   */
  isGroup: true;
  /**
   * Whether the group is highlighted. For example, when a node is being dragged over it.
   */
  highlighted: boolean;
}

/**
 * Interface representing the most basic node in the diagram
 *
 * @public
 * @since 0.8.0
 * @category Types/Model
 */

export interface SimpleNode<T extends DataObject = DataObject> {
  /**
   * The unique identifier for the node.
   */
  id: string;
  /**
   * The position of the node in the diagram.
   */
  position: Point;
  /**
   * The data associated with the node.
   */
  data: T;
  /**
   * The type of the node declared in nodeTemplateMap.
   */
  type?: string;
  /**
   * Whether the node is selected.
   */
  selected?: boolean;
  /**
   * The size of the node.
   */
  size?: Size;
  /**
   * Whether the size of the node is automatically resized based on the content.
   */
  autoSize?: boolean;
  /**
   * The z-order of the node. Controls relative ordering among nodes on the same hierarchy level.
   * With proper values, it can also influence ordering across different hierarchy levels,
   * since each nesting level adds +1 to the computed z-index per child.
   * - Root nodes: used directly as the base z-index (negative values allowed).
   * - Grouped nodes: acts as a minimum floor — cannot go below the parent's z-index.
   *
   * Set by `bringToFront` / `sendToBack` commands, or manually.
   * @see {@link computedZIndex} for the final rendered z-index.
   */
  zOrder?: number;
  /**
   * @readonly
   * @remarks ComputedZIndex is computed by the system and should not be set manually.
   * The final z-index applied to the DOM element for rendering order.
   * Computed from `zOrder`, group hierarchy, and selection elevation.
   * Children are always above their parent group.
   */
  readonly computedZIndex?: number;
  /**
   * @readonly
   * @remarks MeasuredPorts are computed by the system and should not be set manually.
   * The ports of the node with computed position and size.
   */
  readonly measuredPorts?: Port[];
  /**
   * Whether the node is resizable.
   */
  resizable?: boolean;
  /**
   * Whether the node is rotatable.
   */
  rotatable?: boolean;
  /**
   * Whether the node is draggable.
   */
  draggable?: boolean;
  /**
   * The angle of the node from 0 to 360.
   */
  angle?: number;
  /**
   * The id of the parent node.
   */
  groupId?: Node<T>['id'];
  /**
   * @readonly
   * @remarks MeasuredBounds are computed by the system and should not be set manually.
   * Bounding box that encompasses the node including its ports, accounting for rotation.
   */
  measuredBounds?: Rect;
}

/**
 * Interface representing a port in the node.
 *
 * @public
 * @since 0.8.0
 * @category Types/Model
 */
export interface Port {
  /**
   * The unique identifier for the port.
   */
  id: string;
  /**
   * The position of the port in the node.
   */
  position?: Point;
  /**
   * The size of the port.
   */
  size?: Size;
  /**
   * The type of the port.
   */
  type: 'source' | 'target' | 'both';
  /**
   * The id of the node that the port belongs to.
   */
  nodeId: string;
  /**
   * The side of the node that the port is on.
   */
  side: PortSide;
}
