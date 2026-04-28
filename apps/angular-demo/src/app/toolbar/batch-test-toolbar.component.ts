import { Component, inject, output } from '@angular/core';
import {
  type EdgeLabelPosition,
  NgDiagramModelService,
  NgDiagramService,
  NgDiagramViewportService,
  type OriginPoint,
  type PortSide,
} from 'ng-diagram';
import { type DynamicPortData } from '../node-template/dynamic-port-node/dynamic-port-node.component';

@Component({
  selector: 'app-batch-test-toolbar',
  styleUrl: './toolbar.component.scss',
  template: `
    <div>
      <button (click)="exit.emit()">Exit</button>
      <button (click)="onToggleDebugMode()">{{ isDebugMode ? 'Debug: ON' : 'Debug: OFF' }}</button>
      <span class="separator">|</span>
      <span class="group-label">Single-node:</span>
      <button (click)="togglePortSides()">Toggle Port Sides</button>
      <button (click)="togglePortOrigins()">Toggle Port Origins</button>
      <span class="separator">|</span>
      <span class="group-label">Batch (200):</span>
      <button (click)="batchAddPort()">Add Port</button>
      <button (click)="batchRemovePort()">Remove Port</button>
      <button (click)="batchToggleSide()">Toggle Side</button>
      <button (click)="toggleNodeType()">Toggle Node Type</button>
      <span class="separator">|</span>
      <span class="group-label">Labels:</span>
      <button (click)="toggleLabelPosition()">Toggle Label Position</button>
      <button (click)="batchToggleLabel()">Batch Toggle Label</button>
      <span class="separator">|</span>
      <span class="group-label">Measurement:</span>
      <button (click)="resizeAllNodes()">Resize All Nodes</button>
      <button (click)="repositionPorts()">Reposition Ports (CSS)</button>
      <span class="separator">|</span>
      <button (click)="zoomToFit()">Zoom to Fit</button>
    </div>
  `,
})
export class BatchTestToolbarComponent {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly ngDiagramService = inject(NgDiagramService);

  exit = output<void>();

  isDebugMode = false;
  private portCounter = 1;

  resetPortCounter(): void {
    this.portCounter = 1;
  }

  onToggleDebugMode(): void {
    this.isDebugMode = !this.isDebugMode;
    this.ngDiagramService.updateConfig({ debugMode: this.isDebugMode });
  }

  togglePortSides(): void {
    const node = this.modelService
      .getModel()
      .getNodes()
      .find((n) => n.id === 'dp-focus');
    if (!node) return;
    const data = node.data as DynamicPortData;
    this.modelService.updateNodes([
      {
        id: 'dp-focus',
        data: { ...data, ports: data.ports.map((p) => ({ ...p, side: this.toggleSide(p.side) })) },
      },
    ]);
  }

  togglePortOrigins(): void {
    const node = this.modelService
      .getModel()
      .getNodes()
      .find((n) => n.id === 'dp-focus');
    if (!node) return;
    const data = node.data as DynamicPortData;
    this.modelService.updateNodes([
      {
        id: 'dp-focus',
        data: {
          ...data,
          ports: data.ports.map((p) => ({
            ...p,
            originPoint: (p.originPoint === 'topLeft' ? 'bottomRight' : 'topLeft') as OriginPoint,
          })),
        },
      },
    ]);
  }

  batchAddPort(): void {
    const nodes = this.modelService.getModel().getNodes();
    const index = this.portCounter++;
    const side: PortSide = index % 2 === 0 ? 'left' : 'right';
    this.modelService.updateNodes(
      nodes
        .filter((n) => n.id.startsWith('dp-grid-'))
        .map((node) => {
          const data = node.data as DynamicPortData;
          return { id: node.id, data: { ...data, ports: [...data.ports, { id: `port-added-${index}`, side }] } };
        })
    );
  }

  batchRemovePort(): void {
    const nodes = this.modelService.getModel().getNodes();
    this.modelService.updateNodes(
      nodes
        .filter((n) => n.id.startsWith('dp-grid-'))
        .filter((n) => ((n.data as DynamicPortData).ports ?? []).length > 3)
        .map((node) => {
          const data = node.data as DynamicPortData;
          return { id: node.id, data: { ...data, ports: data.ports.slice(0, -1) } };
        })
    );
  }

  batchToggleSide(): void {
    const nodes = this.modelService.getModel().getNodes();
    this.modelService.updateNodes(
      nodes
        .filter((n) => n.id.startsWith('dp-grid-'))
        .map((node) => {
          const data = node.data as DynamicPortData;
          return {
            id: node.id,
            data: { ...data, ports: data.ports.map((p) => ({ ...p, side: this.toggleSide(p.side) })) },
          };
        })
    );
  }

  toggleNodeType(): void {
    const nodes = this.modelService.getModel().getNodes();
    const gridNodes = nodes.filter((n) => n.id.startsWith('dp-grid-'));
    if (gridNodes.length === 0) return;
    const targetType = gridNodes[0].type === 'dynamic-port' ? undefined : 'dynamic-port';
    this.modelService.updateNodes(gridNodes.map((node) => ({ id: node.id, type: targetType })));
  }

  toggleLabelPosition(): void {
    const edge = this.modelService
      .getModel()
      .getEdges()
      .find((e) => e.id === 'dp-focus-edge');
    if (!edge) return;
    const data = edge.data as { labelPosition?: EdgeLabelPosition };
    const current = data.labelPosition ?? 0.5;
    const newPos: EdgeLabelPosition = typeof current === 'number' ? '50px' : 0.5;
    this.modelService.updateEdgeData(edge.id, { ...edge.data, labelPosition: newPos });
  }

  batchToggleLabel(): void {
    const edges = this.modelService.getModel().getEdges();
    this.modelService.updateEdges(
      edges
        .filter((e) => e.id.startsWith('dp-edge-'))
        .map((edge) => {
          const data = edge.data as { labelPosition?: EdgeLabelPosition };
          const current = data.labelPosition ?? 0.5;
          const newPos: EdgeLabelPosition = typeof current === 'number' ? '50px' : 0.5;
          return { id: edge.id, data: { ...edge.data, labelPosition: newPos } };
        })
    );
  }

  resizeAllNodes(): void {
    const nodes = this.modelService.getModel().getNodes();
    this.modelService.updateNodes(
      nodes
        .filter((n) => n.id.startsWith('dp-grid-'))
        .map((node) => {
          const data = node.data as DynamicPortData;
          return { id: node.id, data: { ...data, contentSize: data.contentSize === 'large' ? 'small' : 'large' } };
        })
    );
  }

  repositionPorts(): void {
    const nodes = this.modelService.getModel().getNodes();
    this.modelService.updateNodes(
      nodes
        .filter((n) => n.id.startsWith('dp-grid-'))
        .map((node) => {
          const data = node.data as DynamicPortData;
          return { id: node.id, data: { ...data, ports: [...data.ports].reverse() } };
        })
    );
  }

  zoomToFit(): void {
    this.viewportService.zoomToFit();
  }

  private toggleSide(side: PortSide): PortSide {
    const map: Record<PortSide, PortSide> = { left: 'top', right: 'bottom', top: 'left', bottom: 'right' };
    return map[side];
  }
}
