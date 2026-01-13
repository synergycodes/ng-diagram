import { CommonModule } from '@angular/common';
import { Component, computed, inject, output } from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramSelectionService,
  NgDiagramService,
  NgDiagramViewportService,
  Node,
} from 'ng-diagram';
import { nodeTemplateMap, NodeTemplateType } from '../data/node-template';

@Component({
  selector: 'app-toolbar',
  imports: [CommonModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
  private readonly ngDiagramService: NgDiagramService = inject(NgDiagramService);
  private readonly ngDiagramSelectionService = inject(NgDiagramSelectionService);
  private readonly ngDiagramViewportService = inject(NgDiagramViewportService);
  private readonly ngDiagramModelService = inject(NgDiagramModelService);

  private readonly nodeTypes = Array.from(nodeTemplateMap.keys()) as NodeTemplateType[];

  toggleDebugModeClick = output<void>();
  testVirtualizationClick = output<void>();

  isNodeSelected = computed(() => this.ngDiagramSelectionService.selection().nodes.length > 0);

  isDebugModeEnabled = computed(() => this.ngDiagramService.config().debugMode || false);

  onToggleDebugModeClick(): void {
    this.ngDiagramService.updateConfig({ debugMode: !this.isDebugModeEnabled() });
  }

  onLinkCreationClick() {
    const node = this.ngDiagramSelectionService.selection().nodes[0];
    if (node) {
      this.ngDiagramService.startLinking(node);
    }
  }

  onCenterOnClick() {
    const node = this.ngDiagramSelectionService.selection().nodes[0];

    if (node) {
      this.ngDiagramViewportService.centerOnNode(node.id);
    }
  }

  onZoomToFitClick() {
    this.ngDiagramViewportService.zoomToFit();
  }

  onChangeNodeTypeClick() {
    const selectedNodes = this.ngDiagramSelectionService.selection().nodes;

    if (selectedNodes.length === 0) {
      return;
    }

    selectedNodes.forEach((node) => {
      let newType: NodeTemplateType;
      do {
        newType = this.nodeTypes[Math.floor(Math.random() * this.nodeTypes.length)];
      } while (newType === node.type && this.nodeTypes.length > 1);

      this.ngDiagramModelService.updateNode(node.id, {
        type: newType,
      });
    });
  }

  /**
   * Demonstrates async transaction with waitForMeasurements.
   * Fetches data, adds node, waits for measurements, then zooms to fit.
   */
  async onAsyncTransactionWithMeasurementsDemo() {
    console.log('Starting async transaction with measurements demo...');

    const t1 = performance.now();

    // Async transaction with waitForMeasurements
    await this.ngDiagramService.transaction(
      async () => {
        console.log('Fetching data from server (simulated 500ms delay)...');

        const data = await new Promise<{ label: string }>((resolve) => {
          setTimeout(() => {
            resolve({ label: `Async + Measured Node` });
          }, 500);
        });

        const newNode: Node = {
          id: `async-measured-node-${Date.now()}`,
          type: 'resizable',
          position: { x: 3000, y: 3000 }, // Far outside viewport
          data,
        };

        this.ngDiagramModelService.addNodes([newNode]);
      },
      { waitForMeasurements: true }
    );

    console.log(`Async transaction with measurements complete in ${(performance.now() - t1).toFixed(0)}ms`);
    console.log('Zooming to fit...');

    this.ngDiagramViewportService.zoomToFit();
  }
}
