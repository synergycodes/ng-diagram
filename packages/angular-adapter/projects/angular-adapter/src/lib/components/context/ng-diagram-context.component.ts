import { Component } from '@angular/core';
import { FlowCoreProviderService } from '../../services/flow-core-provider/flow-core-provider.service';
import { FlowResizeBatchProcessorService } from '../../services/flow-resize-observer/flow-resize-processor.service';
import { InputEventsRouterService } from '../../services/input-events/input-events-router.service';
import { NgDiagramService } from '../../services/ng-diagram.service';
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
  ],
})
export class NgDiagramContextComponent {}
