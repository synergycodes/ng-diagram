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
  NgDiagramNodeTemplateMap,
  NgDiagramPaletteItem,
  NodeResizedEvent,
  PaletteItemDroppedEvent,
  provideNgDiagram,
  SelectionChangedEvent,
  SelectionMovedEvent,
  SelectionRemovedEvent,
  SelectionRotatedEvent,
  ViewportChangedEvent,
  type Edge,
  type EdgeLabel,
  type Node,
  type Port,
} from 'ng-diagram';
import { defaultModel } from './data/default-model';
import { nodeTemplateMap } from './data/node-template';
import { paletteModel } from './data/palette-model';
import { ButtonEdgeComponent } from './edge-template/button-edge/button-edge.component';
import { CustomPolylineEdgeComponent } from './edge-template/custom-polyline-edge/custom-polyline-edge.component';
import { DashedEdgeComponent } from './edge-template/dashed-edge/dashed-edge.component';
import { LabelledEdgeComponent } from './edge-template/labelled-edge/labelled-edge.component';
import { ImageMinimapNodeComponent } from './minimap-node-template/image-minimap-node/image-minimap-node.component';
import { PaletteComponent } from './palette/palette.component';
import { ToolbarComponent } from './toolbar/toolbar.component';

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

  paletteModel: NgDiagramPaletteItem[] = paletteModel;
  nodeTemplateMap: NgDiagramNodeTemplateMap = nodeTemplateMap;
  edgeTemplateMap = new NgDiagramEdgeTemplateMap([
    ['button-edge', ButtonEdgeComponent],
    ['custom-polyline-edge', CustomPolylineEdgeComponent],
    ['labelled-edge', LabelledEdgeComponent],
    ['dashed-edge', DashedEdgeComponent],
  ]);

  minimapNodeTemplateMap = new NgDiagramMinimapNodeTemplateMap([['image', ImageMinimapNodeComponent]]);

  config = {
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

  onSelectionMoved(event: SelectionMovedEvent): void {
    console.log('Selection Moved:', {
      nodes: event.nodes.map((n: Node) => n.id),
    });
  }

  onViewportChanged(event: ViewportChangedEvent): void {
    console.log('Viewport Changed:', {
      current: event.viewport,
      previous: event.previousViewport,
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

  onReinitializeModel(): void {
    this.model = initializeModel(defaultModel, this.injector);
  }

  model = initializeModel(defaultModel);

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
