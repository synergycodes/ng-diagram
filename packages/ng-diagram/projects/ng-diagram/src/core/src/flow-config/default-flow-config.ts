import { FlowCore } from '../flow-core';
import { DEFAULT_SHORTCUTS } from '../shortcut-manager';
import type { Edge } from '../types/edge.interface';
import type {
  BackgroundConfig,
  BoxSelectionConfig,
  EdgeRoutingConfig,
  FlowConfig,
  GroupingConfig,
  LinkingConfig,
  NodeRotationConfig,
  ResizeConfig,
  SelectionMovingConfig,
  SnappingConfig,
  ZIndexConfig,
  ZoomConfig,
  ZoomToFitConfig,
} from '../types/flow-config.interface';
import { DeepPartial, Size } from '../types/utils';
import { deepMerge } from '../utils';

export const DEFAULT_NODE_MIN_SIZE = { width: 20, height: 20 };

const defaultResizeConfig: ResizeConfig = {
  getMinNodeSize: (): Size => {
    return { ...DEFAULT_NODE_MIN_SIZE };
  },
  allowResizeBelowChildrenBounds: true,
  defaultResizable: true,
};

const defaultLinkingConfig: LinkingConfig = {
  portSnapDistance: 10,
  edgePanningEnabled: true,
  edgePanningForce: 1,
  edgePanningThreshold: 30,
  validateConnection: (): boolean => {
    // Allow connection by default
    return true;
  },
  temporaryEdgeDataBuilder: (defaultTemporaryEdgeData: Edge): Edge => {
    return {
      ...defaultTemporaryEdgeData,
    };
  },
  finalEdgeDataBuilder: (defaultFinalEdgeData: Edge): Edge => {
    return {
      ...defaultFinalEdgeData,
    };
  },
};

const defaultGroupingConfig: GroupingConfig = {
  canGroup: (): boolean => {
    // Allow grouping by default
    return true;
  },
};

const defaultZoomToFitConfig: ZoomToFitConfig = {
  padding: 50,
  onInit: false,
};

const defaultZoomConfig: ZoomConfig = {
  min: 0.1,
  max: 10.0,
  step: 0.05,
  zoomToFit: defaultZoomToFitConfig,
};

const defaultBackgroundConfig: BackgroundConfig = {
  dotSpacing: 60,
  cellSize: { width: 10, height: 10 },
  majorLinesFrequency: { x: 5, y: 5 },
};

const defaultNodeRotationConfig: NodeRotationConfig = {
  shouldSnapForNode: (): boolean => {
    return false;
  },
  computeSnapAngleForNode: (): number | null => {
    return null;
  },
  defaultSnapAngle: 30,
  defaultRotatable: true,
};

const defaultNodeSnappingConfig: SnappingConfig = {
  shouldSnapDragForNode: (): boolean => {
    return false;
  },
  shouldSnapResizeForNode: (): boolean => {
    return false;
  },
  computeSnapForNodeDrag: (): Size | null => {
    return null;
  },
  computeSnapForNodeSize: (): Size | null => {
    return null;
  },
  defaultDragSnap: { width: 10, height: 10 },
  defaultResizeSnap: { width: 10, height: 10 },
};

const defaultSelectionMovingConfig: SelectionMovingConfig = {
  edgePanningForce: 1,
  edgePanningThreshold: 30,
  edgePanningEnabled: true,
};

const defaultZIndexConfig: ZIndexConfig = {
  enabled: true,
  selectedZIndex: 1000,
  temporaryEdgeZIndex: 1000,
  edgesAboveConnectedNodes: false,
  elevateOnSelection: true,
};

const defaultEdgeRoutingConfig: EdgeRoutingConfig = {
  defaultRouting: 'orthogonal',
  bezier: {
    bezierControlOffset: 100,
  },
  orthogonal: {
    maxCornerRadius: 15,
    firstLastSegmentLength: 20,
  },
};

const defaultBoxSelectionConfig: BoxSelectionConfig = {
  partialInclusion: true,
  realtime: true,
};

/**
 * Default configuration for the flow system.
 */
export const createFlowConfig = (config: DeepPartial<FlowConfig>, flowCore: FlowCore): FlowConfig =>
  deepMerge(
    {
      computeNodeId: () => flowCore.environment.generateId(),
      computeEdgeId: () => flowCore.environment.generateId(),
      resize: defaultResizeConfig,
      linking: defaultLinkingConfig,
      grouping: defaultGroupingConfig,
      zoom: defaultZoomConfig,
      background: defaultBackgroundConfig,
      nodeRotation: defaultNodeRotationConfig,
      snapping: defaultNodeSnappingConfig,
      selectionMoving: defaultSelectionMovingConfig,
      edgeRouting: defaultEdgeRoutingConfig,
      zIndex: defaultZIndexConfig,
      boxSelection: defaultBoxSelectionConfig,
      shortcuts: DEFAULT_SHORTCUTS,
      debugMode: false,
    },
    config
  );
