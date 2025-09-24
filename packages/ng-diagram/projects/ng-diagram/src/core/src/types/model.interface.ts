import { Edge } from './edge.interface';
import { Metadata } from './metadata.interface';
import { Node } from './node.interface';

/**
 * Interface representing the entire model of the flow diagram
 *
 * @category Types
 */
export interface Model {
  /**
   * Array of nodes in the diagram
   */
  nodes: Node[];
  /**
   * Array of edges connecting the nodes
   */
  edges: Edge[];
  /**
   * Metadata associated with the diagram
   */
  metadata: Partial<Metadata>;
}
