import { CommonModule } from '@angular/common';
import { Component, inject, output } from '@angular/core';
import { NgDiagramService } from '@angularflow/angular-adapter';

@Component({
  selector: 'app-toolbar',
  imports: [CommonModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
  private readonly ngDiagramService: NgDiagramService = inject(NgDiagramService);

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
}
