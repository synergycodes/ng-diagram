/*
 * Public API Surface of ng-diagram
 */

// Components
export { NgDiagramBackgroundComponent } from './lib/components/background/ng-diagram-background.component';
export { NgDiagramComponent } from './lib/components/diagram/ng-diagram.component';
export {
  BaseEdgeLabelComponent,
  NgDiagramBaseEdgeLabelComponent,
} from './lib/components/edge-label/base-edge-label/base-edge-label.component';
export { NgDiagramBaseEdgeComponent } from './lib/components/edge/base-edge/base-edge.component';
export { NgDiagramMarkerComponent } from './lib/components/marker/ng-diagram-marker.component';
export { NgDiagramMinimapComponent } from './lib/components/minimap/ng-diagram-minimap.component';
export { NgDiagramBaseNodeTemplateComponent } from './lib/components/node/base-node-template/ng-diagram-base-node-template.component';
export { NgDiagramNodeResizeAdornmentComponent } from './lib/components/node/resize/ng-diagram-node-resize-adornment.component';
export { NgDiagramNodeRotateAdornmentComponent } from './lib/components/node/rotate/ng-diagram-node-rotate-adornment.component';
export { NgDiagramPaletteItemPreviewComponent } from './lib/components/palette/item-preview/ng-diagram-palette-item-preview.component';
export { NgDiagramPaletteItemComponent } from './lib/components/palette/item/ng-diagram-palette-item.component';
export { NgDiagramPortComponent } from './lib/components/port/ng-diagram-port.component';

// Private directives (used via hostDirectives in exported components)
export { CursorPositionTrackerDirective } from './lib/directives/cursor-position-tracker/cursor-position-tracker.directive';
export { BoxSelectionDirective } from './lib/directives/input-events/box-selection/box-selection.directive';
export { MobileBoxSelectionDirective } from './lib/directives/input-events/box-selection/mobile-box-selection.directive';
export { KeyboardInputsDirective } from './lib/directives/input-events/keyboard-inputs/keyboard-inputs.directive';
export { LinkingInputDirective } from './lib/directives/input-events/linking/linking.directive';
export {
  DiagramSelectionDirective,
  EdgeSelectionDirective,
  NodeSelectionDirective,
} from './lib/directives/input-events/object-selection/object-selection.directive';
export { PaletteDropDirective } from './lib/directives/input-events/palette-drop/palette-drop.directive';
export { MobilePanningDirective } from './lib/directives/input-events/panning/mobile-panning.directive';
export { PanningDirective } from './lib/directives/input-events/panning/panning.directive';
export { MobileZoomingDirective } from './lib/directives/input-events/zooming/mobile-zooming.directive';
export { ZoomingWheelDirective } from './lib/directives/input-events/zooming/zooming-wheel.directive';
export { NodePositionDirective } from './lib/directives/node-position/node-position.directive';
export { NodeSizeDirective } from './lib/directives/node-size/node-size.directive';
export { NgDiagramServicesAvailabilityCheckerDirective } from './lib/directives/services-availability-checker/ng-diagram-services-availability-checker.directive';
export { ViewportDirective } from './lib/directives/viewport/viewport.directive';
export { ZIndexDirective } from './lib/directives/z-index/z-index.directive';

// Public directives
export { NgDiagramMinimapNavigationDirective } from './lib/components/minimap/ng-diagram-minimap-navigation.directive';
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
export { configureShortcuts } from './core/src';
export { NgDiagramMinimapNodeTemplateMap } from './lib/components/minimap/ng-diagram-minimap.types';
export { initializeModel } from './lib/model/initialize-model';
export { provideNgDiagram } from './lib/providers/ng-diagram.providers';
export { NgDiagramEdgeTemplateMap } from './lib/types/edge-template-map';
export { NgDiagramNodeTemplateMap } from './lib/types/node-template-map';
export { createMiddlewares } from './lib/utils/create-middlewares';

// Types
export type {
  MinimapNodeShape,
  MinimapNodeStyle,
  MinimapNodeStyleFn,
  NgDiagramMinimapNodeTemplate,
} from './lib/components/minimap/ng-diagram-minimap.types';
export type { NgDiagramConfig } from './lib/types/config';
export type { NgDiagramEdgeTemplate } from './lib/types/edge-template-map';
export type { NgDiagramGroupNodeTemplate, NgDiagramNodeTemplate } from './lib/types/node-template-map';
export type { BasePaletteItemData, GroupNodeData, NgDiagramPaletteItem, SimpleNodeData } from './lib/types/palette';
export type { NgDiagramPanelPosition } from './lib/types/panel-position';
export type { AppMiddlewares } from './lib/utils/create-middlewares';

// Core types re-export
export type {
  ActionState,
  ActionStateManager,
  BackgroundConfig,
  BoxSelectionConfig,
  ClipboardPastedEvent,
  CopyPasteActionState,
  DiagramEventMap,
  DiagramInitEvent,
  DraggingActionState,
  AbsoluteEdgeLabelPosition,
  Edge,
  EdgeDrawnEvent,
  EdgeLabel,
  EdgeLabelPosition,
  EdgeRouting,
  EdgeRoutingConfig,
  EdgeRoutingContext,
  EdgeRoutingManager,
  EdgeRoutingName,
  EnvironmentInfo,
  FlowConfig,
  FlowState,
  FlowStateUpdate,
  GroupingConfig,
  GroupMembershipChangedEvent,
  GroupNode,
  HighlightGroupActionState,
  InputModifiers,
  KeyboardActionName,
  KeyboardMoveSelectionAction,
  KeyboardPanAction,
  KeyboardShortcutBinding,
  KeyboardShortcutDefinition,
  KeyboardZoomAction,
  LinkingActionState,
  LinkingConfig,
  loggerMiddleware,
  Metadata,
  Middleware,
  MiddlewareChain,
  MiddlewareContext,
  MiddlewareHelpers,
  MiddlewareHistoryUpdate,
  Model,
  ModelActionType,
  ModelActionTypes,
  ModelAdapter,
  ModelChanges,
  ModifierOnlyShortcutBinding,
  NgDiagramMath,
  Node,
  NodeDragEndedEvent,
  NodeDragStartedEvent,
  NodeResizeEndedEvent,
  NodeResizedEvent,
  NodeResizeStartedEvent,
  NodeRotateEndedEvent,
  NodeRotateStartedEvent,
  NodeRotationConfig,
  OriginPoint,
  PaletteItemDroppedEvent,
  Point,
  PointerOnlyActionName,
  PointerOnlyShortcutDefinition,
  Port,
  PortLocation,
  PortSide,
  Rect,
  ResizeActionState,
  ResizeConfig,
  RotationActionState,
  RoutingMode,
  SelectionChangedEvent,
  SelectionMovedEvent,
  SelectionMovingConfig,
  SelectionRemovedEvent,
  SelectionRotatedEvent,
  ShortcutActionName,
  ShortcutDefinition,
  SimpleNode,
  Size,
  SnappingConfig,
  TransactionOptions,
  TransactionResult,
  Viewport,
  ViewportChangedEvent,
  VirtualizationConfig,
  WheelOnlyActionName,
  WheelOnlyShortcutDefinition,
  ZIndexConfig,
  ZoomConfig,
} from './core/src';
