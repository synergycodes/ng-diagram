import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FlowService } from '../flow/flow.service';

@Component({
  selector: 'app-toolbar',
  imports: [CommonModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
  private readonly flowCoreProvider = inject(FlowService);

  onTreeLayoutClick(): void {
    this.flowCoreProvider.flowCore.layout('Tree');
  }

  onToggleGroupChildrenClick(): void {
    const flowCore = this.flowCoreProvider.flowCore;
    const model = flowCore.model;
    const metadata = model.getMetadata();

    // NOTE: default middlewares are not included in the metadata
    // Get current state of the move extent middleware (both middlewares should be in sync)
    // const moveExtentEnabled = metadata.middlewaresConfig['group-children-move-extent'].enabled;
    // const changeExtentEnabled = metadata.middlewaresConfig['group-children-change-extent'].enabled;
    const loggerEnabled = metadata.middlewaresConfig['logger'].enabled;

    // Toggle both middlewares
    // flowCore.updateMiddlewareConfig('group-children-move-extent', { enabled: !moveExtentEnabled });
    // flowCore.updateMiddlewareConfig('group-children-change-extent', { enabled: !changeExtentEnabled });
    flowCore.updateMiddlewareConfig('logger', { enabled: !loggerEnabled });
  }
}
