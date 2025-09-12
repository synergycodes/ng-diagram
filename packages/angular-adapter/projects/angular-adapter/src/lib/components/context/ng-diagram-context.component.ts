import { Component } from '@angular/core';
import { NgDiagramClipboardService } from '../../public-services/ng-diagram-clipboard.service';
import { NgDiagramModelService } from '../../public-services/ng-diagram-model.service';
import { NgDiagramSelectionService } from '../../public-services/ng-diagram-selection.service';
import { NgDiagramViewportService } from '../../public-services/ng-diagram-viewport.service';
import { NgDiagramService } from '../../public-services/ng-diagram.service';
import { BatchResizeObserverService } from '../../services';
import { CursorPositionTrackerService } from '../../services/cursor-position-tracker/cursor-position-tracker.service';
import { FlowCoreProviderService } from '../../services/flow-core-provider/flow-core-provider.service';
import { FlowResizeBatchProcessorService } from '../../services/flow-resize-observer/flow-resize-processor.service';
import { InputEventsRouterService } from '../../services/input-events/input-events-router.service';
import { PaletteService } from '../../services/palette/palette.service';
import { RendererService } from '../../services/renderer/renderer.service';
import { UpdatePortsService } from '../../services/update-ports/update-ports.service';

@Component({
  selector: 'ng-diagram-context',
  template: `<ng-content />`,
  host: {
    style: `display: contents;`,
  },
  providers: [
    PaletteService,
    FlowCoreProviderService,
    UpdatePortsService,
    RendererService,
    InputEventsRouterService,
    FlowResizeBatchProcessorService,
    NgDiagramService,
    CursorPositionTrackerService,
    BatchResizeObserverService,
    NgDiagramViewportService,
    NgDiagramModelService,
    NgDiagramSelectionService,
    NgDiagramClipboardService,
  ],
})
export class NgDiagramContextComponent {}
