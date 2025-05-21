import type { Edge } from './edge.interface';
import type { Metadata } from './metadata.interface';
import type { Node } from './node.interface';

/**
 * Interface for model adapters that handle the data management of a flow diagram
 */
export interface ModelAdapter {
  /**
   * Get all nodes in the model
   */
  getNodes(): Node[];

  /**
   * Get all edges in the model
   */
  getEdges(): Edge[];

  /**
   * Set nodes in the model
   * @param nodes Array of nodes to set
   * @param nodesFn Function that takes current nodes and returns new nodes
   */
  setNodes(nodes: Node[]): void;
  setNodes(nodesFn: (nodes: Node[]) => Node[]): void;

  /**
   * Set edges in the model
   * @param edges Array of edges to set
   * @param edgesFn Function that takes current edges and returns new edges
   */
  setEdges(edges: Edge[]): void;
  setEdges(edgesFn: (edges: Edge[]) => Edge[]): void;

  /**
   * Get metadata associated with the model
   */
  getMetadata(): Metadata;

  /**
   * Set metadata for the model
   * @param metadata Metadata to set
   * @param metadataFn Function that takes current metadata and returns new metadata
   */
  setMetadata(metadata: Metadata): void;
  setMetadata(metadataFn: (metadata: Metadata) => Metadata): void;

  /**
   * Register a callback to be called when the model changes
   * @param callback Function to be called on changes
   */
  onChange(callback: ({ nodes, edges, metadata }: { nodes: Node[]; edges: Edge[]; metadata: Metadata }) => void): void;

  /**
   * Undo the last change
   */
  undo(): void;

  /**
   * Redo the last undone change
   */
  redo(): void;
}
