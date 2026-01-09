import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ClipboardPastedEvent,
  configureShortcuts,
  DiagramInitEvent,
  EdgeDrawnEvent,
  GroupMembershipChangedEvent,
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramConfig,
  NgDiagramEdgeTemplateMap,
  NgDiagramNodeTemplateMap,
  NgDiagramPaletteItem,
  NodeResizedEvent,
  PaletteItemDroppedEvent,
  provideNgDiagram,
  SelectionChangedEvent,
  SelectionRemovedEvent,
  SelectionRotatedEvent,
  type Edge,
  type EdgeLabel,
  type Node,
  type Port,
} from 'ng-diagram';
import { nodeTemplateMap } from './data/node-template';
import { paletteModel } from './data/palette-model';
import { ButtonEdgeComponent } from './edge-template/button-edge/button-edge.component';
import { CustomPolylineEdgeComponent } from './edge-template/custom-polyline-edge/custom-polyline-edge.component';
import { DashedEdgeComponent } from './edge-template/dashed-edge/dashed-edge.component';
import { LabelledEdgeComponent } from './edge-template/labelled-edge/labelled-edge.component';
import { PaletteComponent } from './palette/palette.component';
import { ToolbarComponent } from './toolbar/toolbar.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [ToolbarComponent, PaletteComponent, NgDiagramComponent, NgDiagramBackgroundComponent],
  providers: [provideNgDiagram()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  paletteModel: NgDiagramPaletteItem[] = paletteModel;
  nodeTemplateMap: NgDiagramNodeTemplateMap = nodeTemplateMap;
  edgeTemplateMap = new NgDiagramEdgeTemplateMap([
    ['button-edge', ButtonEdgeComponent],
    ['custom-polyline-edge', CustomPolylineEdgeComponent],
    ['labelled-edge', LabelledEdgeComponent],
    ['dashed-edge', DashedEdgeComponent],
  ]);

  config = {
    zoom: {
      max: 2,
    },
    background: {
      cellSize: { width: 10, height: 10 },
    },
    snapping: {
      shouldSnapDragForNode: () => true,
    },
    virtualization: {
      enabled: true,
      padding: 0.4,
    },
    shortcuts: configureShortcuts([
      {
        actionName: 'keyboardMoveSelectionUp',
        bindings: [{ key: 'w' }, { key: 'ArrowUp' }],
      },
      {
        actionName: 'keyboardMoveSelectionDown',
        bindings: [{ key: 's' }, { key: 'ArrowDown' }],
      },
      {
        actionName: 'keyboardMoveSelectionLeft',
        bindings: [{ key: 'a' }, { key: 'ArrowLeft' }],
      },
      {
        actionName: 'keyboardMoveSelectionRight',
        bindings: [{ key: 'd' }, { key: 'ArrowRight' }],
      },
    ]),
  } satisfies NgDiagramConfig;

  onDiagramInit(event: DiagramInitEvent): void {
    console.log('INIT');
    event.nodes.forEach((node: Node) => {
      console.log(`${node.size?.width} ${node.size?.height}`);
      if (node.measuredPorts) {
        node.measuredPorts.forEach((port: Port) =>
          console.log(`${port.size?.width} ${port.size?.height} ${port.position?.x} ${port.position?.y}`)
        );
      }
    });

    event.edges.forEach((edge: Edge) => {
      if (edge.measuredLabels) {
        edge.measuredLabels.forEach((label: EdgeLabel) => {
          console.log(`${label.size?.width} ${label.size?.height} ${label.position?.x} ${label.position?.y}`);
        });
      }
    });
  }

  onSelectionChanged(event: SelectionChangedEvent): void {
    console.log('Selection Changed:', {
      nodes: event.selectedNodes.map((n: Node) => n.id),
      edges: event.selectedEdges.map((e: Edge) => e.id),
      previousNodes: event.previousNodes.map((n: Node) => n.id),
      previousEdges: event.previousEdges.map((e: Edge) => e.id),
    });
  }

  onEdgeDrawn(event: EdgeDrawnEvent): void {
    console.log('Edge Drawn:', {
      edge: event.edge.id,
      source: event.source.id,
      target: event.target.id,
      sourcePort: event.sourcePort,
      targetPort: event.targetPort,
    });
  }

  onClipboardPasted(event: ClipboardPastedEvent): void {
    console.log('Clipboard Pasted:', {
      nodes: event.nodes.map((n: Node) => n.id),
      edges: event.edges.map((e: Edge) => e.id),
    });
  }

  onNodeResized(event: NodeResizedEvent): void {
    console.log('Size Changed:', {
      node: {
        id: event.node.id,
        size: event.node.size,
        previousSize: event.previousSize,
      },
    });
  }

  onPaletteItemDropped(event: PaletteItemDroppedEvent): void {
    console.log('Palette Item Dropped:', {
      node: event.node.id,
      dropPosition: event.dropPosition,
    });
  }

  onSelectionRemoved(event: SelectionRemovedEvent): void {
    console.log('Selection Removed:', {
      nodes: event.deletedNodes.map((n: Node) => n.id),
      edges: event.deletedEdges.map((e: Edge) => e.id),
    });
  }

  onGroupMembershipChanged(event: GroupMembershipChangedEvent): void {
    if (event.grouped.length > 0) {
      event.grouped.forEach((operation) => {
        console.log('Nodes Grouped:', {
          groupedNodes: operation.nodes.map((n: Node) => n.id),
          targetGroup: operation.targetGroup.id,
        });
      });
    }

    if (event.ungrouped.length > 0) {
      console.log('Nodes Ungrouped:', {
        ungroupedNodes: event.ungrouped.map((n: Node) => n.id),
      });
    }
  }

  onSelectionRotated(event: SelectionRotatedEvent): void {
    console.log('Selection Rotated:', {
      nodeId: event.node.id,
      angle: event.angle,
      previousAngle: event.previousAngle,
    });
  }

  // Generate 20k nodes in a grid pattern for virtualization testing
  model = initializeModel(this.generateLargeModel(5000));

  private generateLargeModel(nodeCount: number): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Calculate grid dimensions (roughly square)
    const cols = Math.ceil(Math.sqrt(nodeCount));
    const rows = Math.ceil(nodeCount / cols);

    // Node spacing
    const spacingX = 200;
    const spacingY = 150;

    // Generate nodes in a grid
    for (let i = 0; i < nodeCount; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;

      nodes.push({
        id: `node-${i}`,
        position: {
          x: col * spacingX,
          y: row * spacingY,
        },
        data: { label: `Node ${i}` },
      });

      // Create horizontal edge (to the right neighbor)
      if (col < cols - 1 && i + 1 < nodeCount) {
        edges.push({
          id: `edge-h-${i}`,
          source: `node-${i}`,
          target: `node-${i + 1}`,
          sourcePort: 'port-right',
          targetPort: 'port-left',
          data: {},
        });
      }

      // Create vertical edge (to the bottom neighbor) - only every 5th row to reduce edge count
      if (row < rows - 1 && i + cols < nodeCount && col % 5 === 0) {
        edges.push({
          id: `edge-v-${i}`,
          source: `node-${i}`,
          target: `node-${i + cols}`,
          sourcePort: 'port-right',
          targetPort: 'port-left',
          data: {},
        });
      }
    }

    console.log(`Generated ${nodes.length} nodes and ${edges.length} edges`);
    return { nodes, edges };
  }
}
