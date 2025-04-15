import { Node } from './node.interface';
import { Edge } from './edge.interface';

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
     */
    setNodes(nodes: Node[]): void;

    /**
     * Set edges in the model
     * @param edges Array of edges to set
     */
    setEdges(edges: Edge[]): void;

    /**
     * Get metadata associated with the model
     */
    getMetadata(): Record<string, unknown>;

    /**
     * Set metadata for the model
     * @param metadata Metadata to set
     */
    setMetadata(metadata: Record<string, unknown>): void;

    /**
     * Register a callback to be called when the model changes
     * @param callback Function to be called on changes
     */
    onChange(callback: () => void): void;

    /**
     * Undo the last change
     */
    undo(): void;

    /**
     * Redo the last undone change
     */
    redo(): void;
} 