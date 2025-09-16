import { CommonModule } from '@angular/common';
import { Component, inject, output } from '@angular/core';
import { NgDiagramSelectionService, NgDiagramService } from '@angularflow/angular-adapter';

@Component({
  selector: 'app-toolbar',
  imports: [CommonModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
  private readonly ngDiagramService: NgDiagramService = inject(NgDiagramService);
  private readonly ngDiagramSelectionService = inject(NgDiagramSelectionService);

  toggleDebugModeClick = output<void>();

  onTreeLayoutClick(): void {
    this.ngDiagramService.layout('tree');
  }

  onToggleGroupChildrenClick(): void {
    const allowGroupAutoResize = this.ngDiagramService.getConfig().grouping?.allowGroupAutoResize;
    const isEnabled = allowGroupAutoResize === undefined || allowGroupAutoResize === true;

    this.ngDiagramService.updateConfig({ grouping: { allowGroupAutoResize: !isEnabled } });
  }

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
}
