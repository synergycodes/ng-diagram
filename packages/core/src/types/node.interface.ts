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
    /**
     * Whether the size of the node is controlled by the user.
     */
    controlled?: boolean;
  };
}
