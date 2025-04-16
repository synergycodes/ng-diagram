/**
 * Interface representing an edge (connection) between nodes in the flow diagram
 */
export interface Edge {
  id: string;
  source: string; // source node id
  target: string; // target node id
  type?: string;
  data?: Record<string, unknown>;
}
