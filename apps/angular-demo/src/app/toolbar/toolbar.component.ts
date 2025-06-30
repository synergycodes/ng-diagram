import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FlowCoreProviderService } from '@angularflow/angular-adapter';

@Component({
  selector: 'app-toolbar',
  imports: [CommonModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  onTreeLayoutClick(): void {
    this.flowCoreProvider.provide().layout('Tree');
  }

  onToggleGroupChildrenClick(): void {
    const flowCore = this.flowCoreProvider.provide();
    const model = flowCore.model;
    const metadata = model.getMetadata();

    // Get current state of the move extent middleware (both middlewares should be in sync)
    const moveExtentEnabled = metadata.middlewaresConfig['group-children-move-extent'].enabled;
    const changeExtentEnabled = metadata.middlewaresConfig['group-children-change-extent'].enabled;

    // Toggle both middlewares
    flowCore.updateMiddlewareConfig('group-children-move-extent', { enabled: !moveExtentEnabled });
    flowCore.updateMiddlewareConfig('group-children-change-extent', { enabled: !changeExtentEnabled });
  }
}
