import type { Edge } from './edge.interface';
import type { Metadata } from './metadata.interface';
import type { Node } from './node.interface';

/**
 * Interface for the Renderer that handles drawing the flow diagram
 */
export interface Renderer {
  /**
   * Draws the current state of the flow diagram
   * @param nodes List of nodes to render
   * @param edges List of edges to render
   * @param metadata Additional data needed for rendering
   */
  draw(nodes: Node[], edges: Edge[], metadata: Metadata): void;
}
