# Angular Signals Model Adapter

A model adapter implementation for Angular Flow using Angular Signals for state management.

## Features

- Reactive state management using Angular Signals
- Provides both imperative and reactive interfaces
- Built-in undo/redo functionality
- TypeScript support

## Installation

```bash
npm install @angularflow/angular-signals-model
```

## Usage

### Basic Usage

```typescript
import { Component, inject } from '@angular/core';
import { SignalModelAdapter } from '@angularflow/angular-signals-model';

@Component({
  selector: 'app-flow-editor',
  template: `
    <div>
      <h2>Flow Editor</h2>
      <div>Nodes: {{ nodeCount }}</div>
      <button (click)="addNode()">Add Node</button>
      <button (click)="undo()">Undo</button>
      <button (click)="redo()">Redo</button>
    </div>
  `
})
export class FlowEditorComponent {
  private modelAdapter = inject(SignalModelAdapter);
  
  // Computed value using signals
  nodeCount = this.modelAdapter.getNodesSignal().length;
  
  // Register a callback for changes
  constructor() {
    this.modelAdapter.onChange(() => {
      console.log('Model changed');
    });
  }
  
  addNode() {
    this.modelAdapter.setNodes(nodes => [
      ...nodes,
      {
        id: `node-${Date.now()}`,
        type: 'default',
        position: { x: 100, y: 100 }
      }
    ]);
  }
  
  undo() {
    this.modelAdapter.undo();
  }
  
  redo() {
    this.modelAdapter.redo();
  }
}
```

### Using in a Service

```typescript
import { Injectable, inject } from '@angular/core';
import { SignalModelAdapter } from '@angularflow/angular-signals-model';

@Injectable({ providedIn: 'root' })
export class FlowService {
  private modelAdapter = inject(SignalModelAdapter);
  
  // Expose signals for reactive components
  readonly nodes = this.modelAdapter.getNodesSignal();
  readonly edges = this.modelAdapter.getEdgesSignal();
  
  // Add methods as needed for your application
  addNode(type: string, x: number, y: number) {
    this.modelAdapter.setNodes(nodes => [
      ...nodes,
      {
        id: `node-${Date.now()}`,
        type,
        position: { x, y }
      }
    ]);
  }
  
  connectNodes(sourceId: string, targetId: string) {
    this.modelAdapter.setEdges(edges => [
      ...edges,
      {
        id: `edge-${Date.now()}`,
        source: sourceId,
        target: targetId
      }
    ]);
  }
}
```

## API

### SignalModelAdapter

#### Properties & Methods

**Standard ModelAdapter Interface:**

- `getNodes()`: Get all nodes in the model
- `getEdges()`: Get all edges in the model
- `setNodes(nodes)`: Set nodes in the model
- `setNodes(nodesFn)`: Update nodes with a function
- `setEdges(edges)`: Set edges in the model
- `setEdges(edgesFn)`: Update edges with a function
- `getMetadata()`: Get metadata associated with the model
- `setMetadata(metadata)`: Set metadata for the model
- `onChange(callback)`: Register a callback for model changes
- `undo()`: Undo the last change
- `redo()`: Redo the last undone change

**Signal-specific Additions:**

- `getNodesSignal()`: Get a signal with the nodes array
- `getEdgesSignal()`: Get a signal with the edges array
- `getMetadataSignal()`: Get a signal with the metadata object

## License

MIT 