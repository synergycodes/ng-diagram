/**
 * Interface representing an edge (connection) between nodes in the flow diagram
 */
export interface Edge {
  id: string;
  source: string; // source node id
  target: string; // target node id
  data: Record<string, unknown>;
  selected?: boolean;
  type?: string;
}
