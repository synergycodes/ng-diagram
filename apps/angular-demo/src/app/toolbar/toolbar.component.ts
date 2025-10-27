import { CommonModule } from '@angular/common';
import { Component, inject, output } from '@angular/core';
import { NgDiagramSelectionService, NgDiagramService, NgDiagramViewportService } from 'ng-diagram';

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

  toggleDebugModeClick = output<void>();

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

  onZoomToFitClick() {
    this.ngDiagramViewportService.zoomToFit();
  }
}
