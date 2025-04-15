import { Node } from './node.interface';
import { Edge } from './edge.interface';

/**
 * Interface for viewport data needed for rendering
 */
export interface ViewportData {
  scale: number;
  position: {
    x: number;
    y: number;
  };
}

/**
 * Interface for the Renderer that handles drawing the flow diagram
 */
export interface Renderer {
  /**
   * Draws the current state of the flow diagram
   * @param nodes List of nodes to render
   * @param edges List of edges to render
   * @param viewportData Additional data needed for rendering
   */
  draw(nodes: Node[], edges: Edge[], viewportData: ViewportData): void;
} 