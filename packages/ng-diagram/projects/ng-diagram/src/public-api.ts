/*
 * Public API Surface of ng-diagram
 */

// Components
export { NgDiagramBackgroundComponent } from './lib/components/background/ng-diagram-background.component';
export { NgDiagramComponent } from './lib/components/diagram/ng-diagram.component';
export {
  BaseEdgeLabelComponent,
  NgDiagramBaseEdgeLabelComponent,
} from './lib/components/edge-label/base-edge-label.component';
export { NgDiagramBaseEdgeComponent } from './lib/components/edge/base-edge/base-edge.component';
export { NgDiagramNodeResizeAdornmentComponent } from './lib/components/node/resize/ng-diagram-node-resize-adornment.component';
export { NgDiagramNodeRotateAdornmentComponent } from './lib/components/node/rotate/ng-diagram-node-rotate-adornment.component';
export { NgDiagramPaletteItemPreviewComponent } from './lib/components/palette/item-preview/ng-diagram-palette-item-preview.component';
export { NgDiagramPaletteItemComponent } from './lib/components/palette/item/ng-diagram-palette-item.component';
export { NgDiagramPortComponent } from './lib/components/port/ng-diagram-port.component';

// Private directives (used via hostDirectives in exported components)
export { CursorPositionTrackerDirective } from './lib/directives/cursor-position-tracker/cursor-position-tracker.directive';
export { KeyboardInputsDirective } from './lib/directives/input-events/keyboard-inputs/keyboard-inputs.directive';
export { LinkingInputDirective } from './lib/directives/input-events/linking/linking.directive';
export {
  DiagramSelectionDirective,
  EdgeSelectionDirective,
  NodeSelectionDirective,
} from './lib/directives/input-events/object-selection/object-selection.directive';
export { PaletteDropDirective } from './lib/directives/input-events/palette-drop/palette-drop.directive';
export { PanningDirective } from './lib/directives/input-events/panning/panning.directive';
export { ZoomingPointerDirective } from './lib/directives/input-events/zooming/zooming-pointer.directive';
export { ZoomingWheelDirective } from './lib/directives/input-events/zooming/zooming-wheel.directive';
export { NodePositionDirective } from './lib/directives/node-position/node-position.directive';
export { NodeSizeDirective } from './lib/directives/node-size/node-size.directive';
export { NgDiagramServicesAvailabilityCheckerDirective } from './lib/directives/services-availability-checker/ng-diagram-services-availability-checker.directive';
export { ViewportDirective } from './lib/directives/viewport/viewport.directive';
export { ZIndexDirective } from './lib/directives/z-index/z-index.directive';

// Public directives
export { NgDiagramGroupHighlightedDirective } from './lib/directives/group-highlighted/ng-diagram-group-highlighted.directive';
export { NgDiagramNodeSelectedDirective } from './lib/directives/node-selected/ng-diagram-node-selected.directive';

// Services
export { NgDiagramClipboardService } from './lib/public-services/ng-diagram-clipboard.service';
export { NgDiagramGroupsService } from './lib/public-services/ng-diagram-groups.service';
export { NgDiagramModelService } from './lib/public-services/ng-diagram-model.service';
export { NgDiagramNodeService } from './lib/public-services/ng-diagram-node.service';
export { NgDiagramSelectionService } from './lib/public-services/ng-diagram-selection.service';
export { NgDiagramViewportService } from './lib/public-services/ng-diagram-viewport.service';
export { NgDiagramService } from './lib/public-services/ng-diagram.service';

// Configuration helpers
export { initializeModel } from './lib/model/initialize-model';
export { provideNgDiagram } from './lib/providers/ng-diagram.providers';
export { NgDiagramEdgeTemplateMap } from './lib/types/edge-template-map';
export { NgDiagramNodeTemplateMap } from './lib/types/node-template-map';
export { createMiddlewares } from './lib/utils/create-middlewares';

// Types
export type { NgDiagramConfig } from './lib/types/config';
export type { NgDiagramEdgeTemplate } from './lib/types/edge-template-map';
export type { PointerInputEvent } from './lib/types/event';
export type { NgDiagramGroupNodeTemplate, NgDiagramNodeTemplate } from './lib/types/node-template-map';
export type { NgDiagramPaletteItem } from './lib/types/palette';
export type { AppMiddlewares } from './lib/utils/create-middlewares';

// Core types re-export
export type {
  ActionState,
  BackgroundConfig,
  ClipboardPastedEvent,
  DiagramEventMap,
  DiagramInitEvent,
  Edge,
  EdgeDrawnEvent,
  EdgeLabel,
  EdgeRouting,
  EdgeRoutingConfig,
  EdgeRoutingContext,
  EdgeRoutingName,
  EnvironmentInfo,
  FlowConfig,
  GroupingConfig,
  GroupNode,
  LinkingConfig,
  loggerMiddleware,
  Metadata,
  Middleware,
  MiddlewareChain,
  Model,
  ModelAdapter,
  ModelChanges,
  NgDiagramMath,
  Node,
  NodeResizedEvent,
  NodeRotationConfig,
  PaletteItemDroppedEvent,
  Point,
  Port,
  PortLocation,
  PortSide,
  Rect,
  ResizeConfig,
  RoutingMode,
  SelectionChangedEvent,
  SelectionGroupChangedEvent,
  SelectionMovedEvent,
  SelectionMovingConfig,
  SelectionRemovedEvent,
  SelectionRotatedEvent,
  SimpleNode,
  Size,
  SnappingConfig,
  TransactionResult,
  Viewport,
  ViewportChangedEvent,
  ZIndexConfig,
  ZoomConfig,
} from './core/src';
