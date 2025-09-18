import type { Edge } from './edge.interface';
import type { Viewport } from './metadata.interface';
import type { Node } from './node.interface';

/**
 * Interface for the Renderer that handles drawing the flow diagram
 */
export interface Renderer {
  /**
   * Draws the current state of the flow diagram
   * @param nodes List of nodes to render
   * @param edges List of edges to render
   * @param viewport Viewport to render
   */
  draw(nodes: Node[], edges: Edge[], viewport: Viewport): void;
}
