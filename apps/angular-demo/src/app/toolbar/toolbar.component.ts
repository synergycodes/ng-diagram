import { CommonModule } from '@angular/common';
import { Component, computed, inject, output } from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramSelectionService,
  NgDiagramService,
  NgDiagramViewportService,
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

  isNodeSelected = computed(() => this.ngDiagramSelectionService.selection().nodes.length > 0);

  onToggleDebugModeClick(): void {
    const { debugMode } = this.ngDiagramService.getConfig();

    this.ngDiagramService.updateConfig({ debugMode: !debugMode });
  }

  onLinkCreationClick() {
    const node = this.ngDiagramSelectionService.selection().nodes[0];
    if (node) {
      const port = node.measuredPorts?.find((p) => p.type === 'source' || p.type === 'both')?.id || 'port-right';
      this.ngDiagramService.startLinking(node, port);
    }
  }

  onCenterOnClick() {
    const node = this.ngDiagramSelectionService.selection().nodes[0];

    if (node) {
      this.ngDiagramViewportService.centerOnNode(node.id);
    }
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
}
