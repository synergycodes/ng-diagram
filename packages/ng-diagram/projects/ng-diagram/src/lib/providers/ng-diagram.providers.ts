import { Provider } from '@angular/core';
import { NgDiagramClipboardService } from '../public-services/ng-diagram-clipboard.service';
import { NgDiagramGroupsService } from '../public-services/ng-diagram-groups.service';
import { NgDiagramModelService } from '../public-services/ng-diagram-model.service';
import { NgDiagramNodeService } from '../public-services/ng-diagram-node.service';
import { NgDiagramSelectionService } from '../public-services/ng-diagram-selection.service';
import { NgDiagramViewportService } from '../public-services/ng-diagram-viewport.service';
import { NgDiagramService } from '../public-services/ng-diagram.service';
import { BatchResizeObserverService } from '../services';
import { CursorPositionTrackerService } from '../services/cursor-position-tracker/cursor-position-tracker.service';
import { FlowCoreProviderService } from '../services/flow-core-provider/flow-core-provider.service';
import { FlowResizeBatchProcessorService } from '../services/flow-resize-observer/flow-resize-processor.service';
import { InputEventsRouterService } from '../services/input-events/input-events-router.service';
import { LinkingEventService } from '../services/input-events/linking-event.service';
import { ManualLinkingService } from '../services/input-events/manual-linking.service';
import { MarkerRegistryService } from '../services/marker-registry/marker-registry.service';
import { MinimapProviderService } from '../services/minimap-provider/minimap-provider.service';
import { PaletteService } from '../services/palette/palette.service';
import { RendererService } from '../services/renderer/renderer.service';
import { TemplateProviderService } from '../services/template-provider/template-provider.service';
import { UpdatePortsService } from '../services/update-ports/update-ports.service';

/**
 * Provides all the services required for ng-diagram to function.
 *
 * @returns Array of providers for all ng-diagram services
 *
 * @example
 * ```typescript
 * @Component({
 *   imports: [NgDiagramComponent],
 *   providers: [provideNgDiagram()],
 *   template: `<ng-diagram [model]="model" />`
 * })
 * export class Diagram {
 *   model = initializeModel({
 *     nodes: [
 *       {
 *         id: '1',
 *         position: { x: 0, y: 0 },
 *         data: { label: 'Node 1' }
 *       }
 *     ]
 *   });
 * }
 * ```
 *
 * @public
 * @since 0.8.0
 * @category Utilities
 */
export function provideNgDiagram(): Provider[] {
  return [
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
    NgDiagramNodeService,
    NgDiagramGroupsService,
    LinkingEventService,
    ManualLinkingService,
    TemplateProviderService,
    MarkerRegistryService,
    MinimapProviderService,
  ];
}
