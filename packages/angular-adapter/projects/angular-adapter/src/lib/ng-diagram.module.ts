import { InjectionToken, ModuleWithProviders, NgModule, Provider } from '@angular/core';
import { SignalModelAdapter } from '@angularflow/angular-signals-model';
import {
  edgesRoutingMiddleware,
  FlowConfig,
  groupChildrenChangeExtent,
  groupChildrenMoveExtent,
  loggerMiddleware,
  Metadata,
  Middleware,
  MiddlewareChain,
  MiddlewaresConfigFromMiddlewares,
  ModelAdapter,
  nodePositionSnapMiddleware,
  nodeRotationSnapMiddleware,
  treeLayoutMiddleware,
  zIndexMiddleware,
} from '@angularflow/core';
import { FlowCoreProviderService } from './services/flow-core-provider/flow-core-provider.service';
import { FlowResizeBatchProcessorService } from './services/flow-resize-observer/flow-resize-processor.service';
import { InputEventsRouterService } from './services/input-events/input-events-router.service';
import { RendererService } from './services/renderer/renderer.service';
import { UpdatePortsService } from './services/update-ports/update-ports.service';

export const MIDDLEWARES = new InjectionToken<Middleware[]>('ngDiagram.middlewares');
export const MODEL = new InjectionToken<ModelAdapter<Metadata<MiddlewaresConfigFromMiddlewares<Middleware[]>>>>(
  'ngDiagram.model'
);
export const DIAGRAM_CONFIG = new InjectionToken<FlowConfig>('ngDiagram.diagramConfig');

const BUILTIN_MIDDLEWARES = [
  zIndexMiddleware,
  nodeRotationSnapMiddleware,
  groupChildrenChangeExtent,
  groupChildrenMoveExtent,
  treeLayoutMiddleware,
  nodePositionSnapMiddleware,
  edgesRoutingMiddleware,
  loggerMiddleware,
] as const satisfies MiddlewareChain;

type AppMiddlewares = typeof BUILTIN_MIDDLEWARES;

export function provideMiddlewares<TMiddlewares extends MiddlewareChain = AppMiddlewares>(
  middlewares?: (defaults: AppMiddlewares) => TMiddlewares
): Provider {
  return {
    provide: MIDDLEWARES,
    useFactory: () => {
      if (middlewares) {
        return middlewares(BUILTIN_MIDDLEWARES);
      }

      return BUILTIN_MIDDLEWARES;
    },
  };
}

export function provideModel<TMiddlewares extends MiddlewareChain = AppMiddlewares>(
  modelFactory?: () => SignalModelAdapter<TMiddlewares>
): Provider {
  return {
    provide: MODEL,
    useFactory: () => modelFactory?.() ?? new SignalModelAdapter<TMiddlewares>(),
  };
}

@NgModule()
export class NgDiagramModule {
  static forRoot<TMiddlewares extends MiddlewareChain = AppMiddlewares>(
    config?: FlowConfig,
    middlewares?: (defaults: AppMiddlewares) => TMiddlewares,
    modelFactory?: () => SignalModelAdapter<TMiddlewares>
  ): ModuleWithProviders<NgDiagramModule> {
    return {
      ngModule: NgDiagramModule,
      providers: [
        { provide: DIAGRAM_CONFIG, useValue: config },
        provideMiddlewares<TMiddlewares>(middlewares),
        provideModel<TMiddlewares>(modelFactory),
        FlowCoreProviderService,
        UpdatePortsService,
        RendererService,
        InputEventsRouterService,
        FlowResizeBatchProcessorService,
      ],
    };
  }
}
