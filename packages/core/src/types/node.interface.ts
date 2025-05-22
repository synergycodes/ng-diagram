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
  position: {
    x: number;
    y: number;
  };
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
  size?: {
    width: number;
    height: number;
  };
  /**
   * Whether the size of the node is automatically resized based on the content.
   */
  autoSize?: boolean;
  /**
   * The z-order of the node.
   */
  zOrder?: number;
  /**
   * The ports of the node.
   */
  ports?: Port[];
  /**
   * Whether the node is resizable.
   */
  resizable?: boolean;
  /**
   * The angle of the node from 0 to 1.
   */
  angle?: number;
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
  position: {
    x: number;
    y: number;
  };
  /**
   * The size of the port.
   */
  size: {
    width: number;
    height: number;
  };
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
  side: 'top' | 'right' | 'bottom' | 'left';
}
