import { NgModule } from '@angular/core';
import { AngularAdapterDiagramComponent } from './components/diagram/angular-adapter-diagram.component';
import { FlowCoreProviderService } from './services/flow-core-provider/flow-core-provider.service';
import { FlowResizeBatchProcessorService } from './services/flow-resize-observer/flow-resize-processor.service';
import { InputEventsRouterService } from './services/input-events/input-events-router.service';
import { RendererService } from './services/renderer/renderer.service';
import { UpdatePortsService } from './services/update-ports/update-ports.service';

@NgModule({
  imports: [AngularAdapterDiagramComponent],
  exports: [AngularAdapterDiagramComponent],
  providers: [
    FlowCoreProviderService,
    UpdatePortsService,
    RendererService,
    InputEventsRouterService,
    FlowResizeBatchProcessorService,
  ],
})
export class NgDiagramModule {}
