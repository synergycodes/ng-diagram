import type { Edge, Metadata, ModelAdapter, Node } from 'ng-diagram';

export class LocalStorageModelAdapter implements ModelAdapter {
  private callbacks: Array<
    (data: { nodes: Node[]; edges: Edge[]; metadata: Metadata }) => void
  > = [];
  public readonly storageKey: string;

  constructor(
    storageKey: string = 'ng-diagram-data',
    initialData?: { nodes?: Node[]; edges?: Edge[]; metadata?: Metadata }
  ) {
    this.storageKey = storageKey;

    // Initialize storage if it doesn't exist
    if (!localStorage.getItem(this.storageKey)) {
      const defaultData = {
        nodes: initialData?.nodes || [],
        edges: initialData?.edges || [],
        metadata: initialData?.metadata || {
          viewport: { x: 0, y: 0, scale: 1 },
        },
      };
      localStorage.setItem(this.storageKey, JSON.stringify(defaultData));
    }
  }

  // Core data access methods - read directly from localStorage
  getNodes(): Node[] {
    const data = this.getStorageData();
    return data.nodes || [];
  }

  getEdges(): Edge[] {
    const data = this.getStorageData();
    return data.edges || [];
  }

  getMetadata(): Metadata {
    const data = this.getStorageData();
    return data.metadata || { viewport: { x: 0, y: 0, scale: 1 } };
  }

  // Data modification methods - write directly to localStorage
  updateNodes(next: Node[] | ((prev: Node[]) => Node[])): void {
    const currentNodes = this.getNodes();
    const newNodes = typeof next === 'function' ? next(currentNodes) : next;
    this.updateStorageData({ nodes: newNodes });
    this.notifyCallbacks();
  }

  updateEdges(next: Edge[] | ((prev: Edge[]) => Edge[])): void {
    const currentEdges = this.getEdges();
    const newEdges = typeof next === 'function' ? next(currentEdges) : next;
    this.updateStorageData({ edges: newEdges });
    this.notifyCallbacks();
  }

  setMetadata(next: Metadata | ((prev: Metadata) => Metadata)): void {
    const currentMetadata = this.getMetadata();
    const newMetadata =
      typeof next === 'function' ? next(currentMetadata) : next;
    this.updateStorageData({ metadata: newMetadata });
    this.notifyCallbacks();
  }

  // Change notification system
  onChange(
    callback: (data: {
      nodes: Node[];
      edges: Edge[];
      metadata: Metadata;
    }) => void
  ): void {
    this.callbacks.push(callback);
  }

  unregisterOnChange(
    callback: (data: {
      nodes: Node[];
      edges: Edge[];
      metadata: Metadata;
    }) => void
  ): void {
    this.callbacks = this.callbacks.filter((cb) => cb !== callback);
  }

  // History management (simplified implementation)
  undo(): void {
    console.log('Undo operation - implement based on your requirements');
  }

  redo(): void {
    console.log('Redo operation - implement based on your requirements');
  }

  // Serialization
  toJSON(): string {
    return JSON.stringify(this.getStorageData());
  }

  // Cleanup
  destroy(): void {
    this.callbacks = [];
  }

  // Private storage methods
  private getStorageData(): {
    nodes: Node[];
    edges: Edge[];
    metadata: Metadata;
  } {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored
        ? JSON.parse(stored)
        : {
            nodes: [],
            edges: [],
            metadata: { viewport: { x: 0, y: 0, scale: 1 } },
          };
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return {
        nodes: [],
        edges: [],
        metadata: { viewport: { x: 0, y: 0, scale: 1 } },
      };
    }
  }

  private updateStorageData(
    updates: Partial<{ nodes: Node[]; edges: Edge[]; metadata: Metadata }>
  ): void {
    try {
      const currentData = this.getStorageData();
      const newData = { ...currentData, ...updates };
      localStorage.setItem(this.storageKey, JSON.stringify(newData));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  private notifyCallbacks(): void {
    const data = {
      nodes: this.getNodes(),
      edges: this.getEdges(),
      metadata: this.getMetadata(),
    };

    for (const callback of this.callbacks) {
      callback(data);
    }
  }
}
