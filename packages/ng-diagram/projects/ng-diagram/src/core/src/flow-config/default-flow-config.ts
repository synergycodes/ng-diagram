import type { Edge } from '../types/edge.interface';
import type {
  BackgroundConfig,
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
} from '../types/flow-config.interface';
import { Point, Size } from '../types/utils';

export const DEFAULT_NODE_MIN_SIZE = { width: 20, height: 20 };

const defaultComputeNodeId = (): string => {
  return crypto.randomUUID();
};

const defaultComputeEdgeId = (): string => {
  return crypto.randomUUID();
};

const defaultResizeConfig: ResizeConfig = {
  getMinNodeSize: (): Size => {
    return { ...DEFAULT_NODE_MIN_SIZE };
  },
};

const defaultLinkingConfig: LinkingConfig = {
  portSnapDistance: 10,
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
  allowGroupAutoResize: true,
};

const defaultZoomConfig: ZoomConfig = {
  min: 0.1,
  max: 10.0,
  step: 0.05,
};

const defaultBackgroundConfig: BackgroundConfig = {
  dotSize: 60,
};

const defaultNodeRotationConfig: NodeRotationConfig = {
  shouldSnapForNode: (): boolean => {
    return true;
  },
  computeSnapAngleForNode: (): number | null => {
    return null;
  },
  defaultSnapAngle: 30,
};

const defaultNodeDraggingConfig: SnappingConfig = {
  shouldSnapDragForNode: (): boolean => {
    return false;
  },
  shouldSnapResizeForNode: (): boolean => {
    return true;
  },
  computeSnapForNodeDrag: (): Point | null => {
    return null;
  },
  computeSnapForNodeSize: (): Point | null => {
    return null;
  },
  defaultDragSnap: { x: 10, y: 10 },
  defaultResizeSnap: { x: 10, y: 10 },
};

const defaultSelectionMovingConfig: SelectionMovingConfig = {
  edgePanningForce: 15,
  edgePanningThreshold: 10,
};

const defaultEdgeRoutingConfig: EdgeRoutingConfig = {
  defaultRouting: 'polyline',
  bezier: {
    bezierControlOffset: 100,
  },
  orthogonal: {
    maxCornerRadius: 15,
    firstLastSegmentLength: 20,
  },
};

const defaultZIndexConfig: ZIndexConfig = {
  enabled: true,
  selectedZIndex: 1000,
  edgesAboveConnectedNodes: false,
  elevateOnSelection: true,
  temporaryEdgeZIndex: 1000,
};

/**
 * Default configuration for the flow system.
 */
export const defaultFlowConfig: FlowConfig = {
  computeNodeId: defaultComputeNodeId,
  computeEdgeId: defaultComputeEdgeId,
  resize: defaultResizeConfig,
  linking: defaultLinkingConfig,
  grouping: defaultGroupingConfig,
  zoom: defaultZoomConfig,
  background: defaultBackgroundConfig,
  nodeRotation: defaultNodeRotationConfig,
  snapping: defaultNodeDraggingConfig,
  selectionMoving: defaultSelectionMovingConfig,
  edgeRouting: defaultEdgeRoutingConfig,
  zIndex: defaultZIndexConfig,
  debugMode: false,
};
