import type { Point, PortSide, Size } from './utils';

/**
 * Interface representing a node in the flow diagram
 */
export interface Node {
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
  type: string;
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
   * The angle of the node from 0 to 360.
   */
  angle?: number;
  /**
   * The id of the parent node.
   */
  groupId?: Node['id'];
  /**
   * Whether the node is treated as a group node.
   */
  isGroup?: boolean;
  /**
   * Whether the group is highlighted.
   * NOTE: group only property
   */
  highlighted?: boolean;
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
