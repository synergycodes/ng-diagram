import { CommonModule } from '@angular/common';
import { Component, inject, output } from '@angular/core';
import { AppMiddlewares, NgDiagramModelService, NgDiagramService } from '@angularflow/angular-adapter';

@Component({
  selector: 'app-toolbar',
  imports: [CommonModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
  private readonly ngDiagramService: NgDiagramService<AppMiddlewares> = inject(NgDiagramService<AppMiddlewares>);
  private readonly ngDiagramModelService = inject(NgDiagramModelService);

  toggleDebugModeClick = output<void>();

  onTreeLayoutClick(): void {
    this.ngDiagramService.layout('tree');
  }

  onToggleGroupChildrenClick(): void {
    const metadata = this.ngDiagramModelService.metadata();

    const middlewaresConfig = metadata.middlewaresConfig as Record<string, { enabled: boolean }>;

    const moveExtentEnabled = middlewaresConfig['group-children-move-extent'].enabled;
    const changeExtentEnabled = middlewaresConfig['group-children-change-extent'].enabled;

    // Toggle both middlewares
    this.ngDiagramService.updateMiddlewareConfig('group-children-move-extent', { enabled: !moveExtentEnabled });
    this.ngDiagramService.updateMiddlewareConfig('group-children-change-extent', { enabled: !changeExtentEnabled });
  }
}
