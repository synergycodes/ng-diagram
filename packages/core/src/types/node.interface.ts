import type { Point, PortSide, Size } from './utils';

export type Node = SimpleNode | GroupNode;

export interface GroupNode extends SimpleNode {
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
 * Interface representing a node in the flow diagram
 */
export interface SimpleNode {
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
  data: Record<string, unknown>;
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
   * The z-order of the node.
   */
  zOrder?: number;
  /**
   * The z-index of the node. This value is set automatically
   */
  zIndex?: number;
  /**
   * The ports of the node.
   */
  ports?: Port[];
  /**
   * Whether the node is resizable.
   */
  resizable?: boolean;
  /**
   * Whether the node is rotatable.
   */
  rotatable?: boolean;
  /**
   * The angle of the node from 0 to 360.
   */
  angle?: number;
  /**
   * The rotation center point as normalized values (0-1).
   * If not specified, defaults to the node's center { x: 0.5, y: 0.5 }.
   * Example: { x: 0, y: 0 } for top-left corner, { x: 1, y: 1 } for bottom-right.
   * The actual pixel position is calculated as: position + size * rotationCenter
   */
  rotationCenter?: Point;
  /**
   * The id of the parent node.
   */
  groupId?: Node['id'];
}

/**
 * Interface representing a port in the node.
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
