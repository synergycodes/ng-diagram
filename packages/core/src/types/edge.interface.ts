/**
 * Interface representing an edge (connection) between nodes in the flow diagram
 */
export interface Edge {
  id: string;
  source: string;
  target: string;
  data: Record<string, unknown>;
  points?: { x: number; y: number }[];
  selected?: boolean;
  type?: string;
  fromPort?: string | null;
  toPort?: string | null;
  sourceArrowhead?: string;
  targetArrowhead?: string;
}
