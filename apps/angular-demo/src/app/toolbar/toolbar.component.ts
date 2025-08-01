import { CommonModule } from '@angular/common';
import { Component, inject, output } from '@angular/core';
import { AppMiddlewares, NgDiagramService } from '@angularflow/angular-adapter';

@Component({
  selector: 'app-toolbar',
  imports: [CommonModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
  private readonly ngDiagramService: NgDiagramService<AppMiddlewares> = inject(NgDiagramService<AppMiddlewares>);

  toggleDebugModeClick = output<void>();

  onTreeLayoutClick(): void {
    this.ngDiagramService.layout('Tree');
  }

  onToggleGroupChildrenClick(): void {
    const model = this.ngDiagramService.getModel();
    const metadata = model.getMetadata();

    const moveExtentEnabled = metadata.middlewaresConfig['group-children-move-extent'].enabled;
    const changeExtentEnabled = metadata.middlewaresConfig['group-children-change-extent'].enabled;

    // Toggle both middlewares
    this.ngDiagramService.updateMiddlewareConfig('group-children-move-extent', { enabled: !moveExtentEnabled });
    this.ngDiagramService.updateMiddlewareConfig('group-children-change-extent', { enabled: !changeExtentEnabled });
  }
}
