/**
 * Interface representing a node in the flow diagram
 */
export interface Node {
  id: string;
  position: {
    x: number;
    y: number;
  };
  data: Record<string, unknown>;
  type: string;
  selected?: boolean;
}
