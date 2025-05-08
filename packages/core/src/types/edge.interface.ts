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
  points?: { x: number; y: number }[];
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
  sourcePort?: string | null;
  /**
   * The port of the target node.
   */
  targetPort?: string | null;
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
  sourcePosition?: { x: number; y: number };
  /**
   * The position of the edge end.
   */
  targetPosition?: { x: number; y: number };
}
