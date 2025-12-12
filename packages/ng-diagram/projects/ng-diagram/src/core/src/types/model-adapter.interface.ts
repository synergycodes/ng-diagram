import type { Edge } from './edge.interface';
import type { Metadata } from './metadata.interface';
import type { Node } from './node.interface';

/**
 * Interface representing a snapshot of the diagram model state.
 *
 * This read-only interface is provided by the library when the model changes.
 * It contains the complete current state of nodes, edges, and metadata.
 * Typically received in `onChange` callbacks to observe model updates.
 *
 * @public
 * @since 0.8.0
 * @category Types/Model
 */
export interface ModelChanges {
  /** Current array of all nodes in the diagram. */
  nodes: Node[];
  /** Current array of all edges in the diagram. */
  edges: Edge[];
  /** Current metadata associated with the diagram. */
  metadata: Metadata;
}

/**
 * Interface for model adapters that handle the data management of a flow diagram
 *
 * @public
 * @since 0.8.0
 * @category Types/Model
 */
export interface ModelAdapter {
  /**
   * Destroy the model adapter and clean up resources
   * This should be called when the model is no longer needed to prevent memory leaks
   */
  destroy(): void;

  /**
   * Get all nodes in the model
   */
  getNodes(): Node[];

  /**
   * Get all edges in the model
   */
  getEdges(): Edge[];

  /**
   * Update nodes in the model
   * @param nodes Array of nodes to set
   * @param nodesFn Function that takes current nodes and returns new nodes
   */
  updateNodes(nodes: Node[]): void;
  updateNodes(nodesFn: (nodes: Node[]) => Node[]): void;

  /**
   * Update edges in the model
   * @param edges Array of edges to set
   * @param edgesFn Function that takes current edges and returns new edges
   */
  updateEdges(edges: Edge[]): void;
  updateEdges(edgesFn: (edges: Edge[]) => Edge[]): void;

  /**
   * Get metadata associated with the model
   */
  getMetadata(): Metadata;

  /**
   * Set metadata for the model
   * @param metadata Metadata to set
   * @param metadataFn Function that takes current metadata and returns new metadata
   */
  updateMetadata(metadata: Metadata): void;
  updateMetadata(metadataFn: (metadata: Metadata) => Metadata): void;

  /**
   * Register a callback to be called when the model changes
   * @param callback Function to be called on changes
   */
  onChange(callback: ({ nodes, edges, metadata }: ModelChanges) => void): void;

  /**
   * Unregister a callback from being called when the model changes
   * @param callback Function to unregister from changes
   */
  unregisterOnChange(callback: ({ nodes, edges, metadata }: ModelChanges) => void): void;

  /**
   * Undo the last change
   */
  undo(): void;

  /**
   * Redo the last undone change
   */
  redo(): void;

  /**
   * Convert the model to a JSON string
   */
  toJSON(): string;
}
