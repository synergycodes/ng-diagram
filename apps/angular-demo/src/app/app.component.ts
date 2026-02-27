import { ChangeDetectionStrategy, Component, inject, Injector } from '@angular/core';
import {
  ClipboardPastedEvent,
  configureShortcuts,
  DiagramInitEvent,
  EdgeDrawnEvent,
  GroupMembershipChangedEvent,
  initializeModel,
  MinimapNodeStyle,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramConfig,
  NgDiagramEdgeTemplateMap,
  NgDiagramMinimapComponent,
  NgDiagramMinimapNodeTemplateMap,
  NgDiagramModelService,
  NgDiagramNodeTemplateMap,
  NgDiagramPaletteItem,
  NodeDragEndedEvent,
  NodeDragStartedEvent,
  NodeResizedEvent,
  NodeResizeEndedEvent,
  NodeResizeStartedEvent,
  NodeRotateEndedEvent,
  NodeRotateStartedEvent,
  PaletteItemDroppedEvent,
  provideNgDiagram,
  SelectionChangedEvent,
  SelectionGestureEndedEvent,
  SelectionRemovedEvent,
  SelectionRotatedEvent,
  type Edge,
  type EdgeLabel,
  type Node,
  type Port,
} from 'ng-diagram';
import { defaultModel } from './data/default-model';
import { generateModel } from './data/generate-model';
import { nodeTemplateMap } from './data/node-template';
import { paletteModel } from './data/palette-model';
import { virtualizationConfigOverrides, virtualizationTestConfig } from './data/virtualization-test.config';
import { ButtonEdgeComponent } from './edge-template/button-edge/button-edge.component';
import { CustomPolylineEdgeComponent } from './edge-template/custom-polyline-edge/custom-polyline-edge.component';
import { DashedEdgeComponent } from './edge-template/dashed-edge/dashed-edge.component';
import { LabelledEdgeComponent } from './edge-template/labelled-edge/labelled-edge.component';
import { ImageMinimapNodeComponent } from './minimap-node-template/image-minimap-node/image-minimap-node.component';
import { PaletteComponent } from './palette/palette.component';
import { ToolbarComponent } from './toolbar/toolbar.component';

const LOCAL_STORAGE_KEY = 'ng-diagram-demo';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    ToolbarComponent,
    PaletteComponent,
    NgDiagramComponent,
    NgDiagramBackgroundComponent,
    NgDiagramMinimapComponent,
  ],
  providers: [provideNgDiagram()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly injector = inject(Injector);
  private readonly modelService = inject(NgDiagramModelService);

  paletteModel: NgDiagramPaletteItem[] = paletteModel;
  nodeTemplateMap: NgDiagramNodeTemplateMap = nodeTemplateMap;
  edgeTemplateMap = new NgDiagramEdgeTemplateMap([
    ['button-edge', ButtonEdgeComponent],
    ['custom-polyline-edge', CustomPolylineEdgeComponent],
    ['labelled-edge', LabelledEdgeComponent],
    ['dashed-edge', DashedEdgeComponent],
  ]);

  minimapNodeTemplateMap = new NgDiagramMinimapNodeTemplateMap([['image', ImageMinimapNodeComponent]]);

  config: NgDiagramConfig = {
    zoom: {
      max: 2,
      zoomToFit: {
        onInit: true,
        padding: [50, 50, 100, 350],
      },
    },
    resize: {
      allowResizeBelowChildrenBounds: false,
    },
    background: {
      cellSize: { width: 10, height: 10 },
    },
    snapping: {
      shouldSnapDragForNode: () => true,
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
  };

  model = initializeModel(defaultModel);

  enableVirtualizationTest(): void {
    this.config = {
      ...this.config,
      ...virtualizationConfigOverrides,
    };
    this.model = initializeModel(generateModel(virtualizationTestConfig.nodeCount), this.injector);
  }

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

  onSelectionGestureEnded(event: SelectionGestureEndedEvent): void {
    console.log('Selection Gesture Ended:', {
      nodes: event.nodes.map((n: Node) => n.id),
      edges: event.edges.map((e: Edge) => e.id),
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

  onNodeResizeStarted(event: NodeResizeStartedEvent): void {
    console.log('Node Resize Started:', {
      node: event.node.id,
    });
  }

  onNodeResizeEnded(event: NodeResizeEndedEvent): void {
    console.log('Node Resize Ended:', {
      node: { id: event.node.id, size: event.node.size },
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

  onNodeRotateStarted(event: NodeRotateStartedEvent): void {
    console.log('Node Rotate Started:', {
      node: event.node.id,
    });
  }

  onNodeRotateEnded(event: NodeRotateEndedEvent): void {
    console.log('Node Rotate Ended:', {
      node: { id: event.node.id, angle: event.node.angle },
    });
  }

  onNodeDragStarted(event: NodeDragStartedEvent): void {
    console.log('Node Drag Started:', {
      nodes: event.nodes.map((n: Node) => n.id),
    });
  }

  onNodeDragEnded(event: NodeDragEndedEvent): void {
    console.log('Node Drag Ended:', {
      nodes: event.nodes.map((n: Node) => ({ id: n.id, position: n.position })),
    });
  }

  onSaveModel(): void {
    localStorage.setItem(LOCAL_STORAGE_KEY, this.modelService.toJSON());
  }

  onLoadModel(): void {
    const json = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!json) return;

    const data = JSON.parse(json);
    this.model = initializeModel(data, this.injector);
  }

  onReinitializeModel(): void {
    this.config = {
      ...this.config,
      virtualization: {
        enabled: false,
      },
    };
    this.model = initializeModel(defaultModel, this.injector);
  }

  nodeStyle(node: Node): MinimapNodeStyle {
    const style: MinimapNodeStyle = {};

    if (node.id == '13') {
      style.shape = 'circle';
    }

    if (node.selected) {
      style.stroke = 'var(--ngd-node-stroke-primary-hover)';
      style.strokeWidth = 5;
    }

    return style;
  }
}
