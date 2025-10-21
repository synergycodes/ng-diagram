import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  DiagramInitEvent,
  EdgeDrawnEvent,
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramConfig,
  NgDiagramEdgeTemplateMap,
  NgDiagramNodeTemplateMap,
  NgDiagramPaletteItem,
  provideNgDiagram,
  SelectionChangedEvent,
  SelectionMovedEvent,
  ViewportChangedEvent,
} from 'ng-diagram';
import { nodeTemplateMap } from './data/node-template';
import { paletteModel } from './data/palette-model';
import { ButtonEdgeComponent } from './edge-template/button-edge/button-edge.component';
import { CustomPolylineEdgeComponent } from './edge-template/custom-polyline-edge/custom-polyline-edge.component';
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
  ]);

  config: NgDiagramConfig = {
    zoom: {
      max: 2,
    },
    background: {
      dotSize: 40,
    },
    snapping: {
      shouldSnapDragForNode: () => true,
    },
    edgeRouting: {
      defaultRouting: 'orthogonal',
    },
  };

  onDiagramInit(event: DiagramInitEvent): void {
    console.log('INIT');
    event.nodes.forEach((node) => {
      console.log(`${node.size?.width} ${node.size?.height}`);
      if (node.measuredPorts) {
        node.measuredPorts.forEach((port) =>
          console.log(`${port.size?.width} ${port.size?.height} ${port.position?.x} ${port.position?.y}`)
        );
      }
    });

    event.edges.forEach((edge) => {
      if (edge.measuredLabels) {
        edge.measuredLabels.forEach((label) => {
          console.log(`${label.size?.width} ${label.size?.height} ${label.position?.x} ${label.position?.y}`);
        });
      }
    });
  }

  onSelectionChanged(event: SelectionChangedEvent): void {
    console.log('Selection Changed:', {
      nodes: event.selectedNodes.map((n) => n.id),
      edges: event.selectedEdges.map((e) => e.id),
      previousNodes: event.previousNodes.map((n) => n.id),
      previousEdges: event.previousEdges.map((e) => e.id),
    });
  }

  onSelectionMoved(event: SelectionMovedEvent): void {
    console.log('Selection Moved:', {
      nodes: event.nodes.map((n) => n.id),
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

  model = initializeModel({
    nodes: [
      {
        id: '1',
        type: 'image',
        position: { x: 100, y: 50 },
        data: { imageUrl: 'https://tinyurl.com/bddnt44s' },
      },
      { id: '2', type: 'input-field', position: { x: 400, y: 100 }, data: {} },
      {
        id: '3',
        type: 'resizable',
        position: { x: 700, y: 200 },
        size: { width: 300, height: 400 },
        autoSize: false,
        data: {},
        angle: 45,
      },
      {
        id: '4',
        position: { x: 800, y: 350 },
        data: {},
        isGroup: true,
      },
      {
        id: '5',
        position: { x: 100, y: 250 },
        data: { label: 'edge is manual' },
      },
      {
        id: '6',
        position: { x: 463, y: 382 },
        data: { label: "so it's ok it's unconnected after move" },
      },
      {
        id: '7',
        position: { x: 100, y: 450 },
        data: {},
      },
      {
        id: '8',
        position: { x: 550, y: 550 },
        data: {},
      },
      {
        id: '9',
        position: { x: 100, y: 650 },
        data: { label: 'just bezier edge' },
      },
      {
        id: '10',
        position: { x: 450, y: 750 },
        data: {},
      },
      {
        id: '11',
        position: { x: 600, y: 650 },
        data: { label: 'test linking' },
      },
      {
        id: '12',
        position: { x: 1000, y: 550 },
        data: {},
      },
    ],
    edges: [
      {
        id: '1',
        source: '1',
        target: '2',
        data: {},
        sourcePort: 'port-right',
        targetPort: 'port-left',
        routing: 'orthogonal',
      },
      {
        id: '2',
        source: '2',
        target: '3',
        data: {},
        sourcePort: 'port-right',
        targetPort: 'port-left-1',
        type: 'button-edge',
      },
      {
        id: '3',
        source: '5',
        target: '6',
        data: { labelPosition: '0.45' },
        sourcePort: 'port-right',
        targetPort: 'port-left',
        type: 'labelled-edge',
        routing: 'orthogonal',
        routingMode: 'manual',
        points: [
          { x: 300, y: 274 },
          { x: 380, y: 274 },
          { x: 380, y: 314 },
          { x: 420, y: 314 },
          { x: 420, y: 354 },
          { x: 380, y: 354 },
          { x: 380, y: 407 },
          { x: 460, y: 407 },
        ],
      },
      {
        id: '4',
        source: '7',
        target: '8',
        data: {},
        sourcePort: 'port-right',
        targetPort: 'port-left',
        type: 'custom-polyline-edge',
      },
      {
        id: '5',
        source: '9',
        target: '10',
        data: { labelPosition: 0.7 },
        sourcePort: 'port-right',
        targetPort: 'port-left',
        type: 'labelled-edge',
        routing: 'bezier',
      },
    ],
    metadata: {
      viewport: { x: 300, y: 0, scale: 1 },
    },
  });
}
