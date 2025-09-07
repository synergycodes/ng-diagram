import { LayoutAlignmentType, LayoutAngleType } from '../types';
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
  TreeLayoutConfig,
  ZoomConfig,
} from '../types/flow-config.interface';
import { Point, Size } from '../types/utils';
import { isGroup } from '../utils';

export const DEFAULT_NODE_SIZE = { width: 180, height: 32 };
export const DEFAULT_GROUP_SIZE = { width: 145, height: 145 };
export const DEFAULT_MIN_NODE_SIZE = { width: 20, height: 20 };

const defaultComputeNodeId = (): string => {
  return crypto.randomUUID();
};

const defaultComputeEdgeId = (): string => {
  return crypto.randomUUID();
};

const defaultResizeConfig: ResizeConfig = {
  getMinNodeSize: (): Size => {
    return { ...DEFAULT_MIN_NODE_SIZE };
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
};

const defaultZoomConfig: ZoomConfig = {
  min: 0.1,
  max: 10.0,
  step: 0.05,
};

const defaultBackgroundConfig: BackgroundConfig = {
  dotSize: 60,
};

const defaultTreeLayoutConfig: TreeLayoutConfig = {
  getLayoutAngleForNode: (): LayoutAngleType | null => {
    return null;
  },
  getLayoutAlignmentForNode: (): LayoutAlignmentType | null => {
    return null;
  },
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

/**
 * Default configuration for the flow system.
 */
export const defaultFlowConfig: FlowConfig = {
  computeNodeId: defaultComputeNodeId,
  computeEdgeId: defaultComputeEdgeId,
  getDefaultNodeSize: (node): Size | null => {
    // Default sizes for built-in node types
    if (!node.type) {
      if (isGroup(node)) {
        return { ...DEFAULT_GROUP_SIZE };
      }
      return { ...DEFAULT_NODE_SIZE };
    }
    return null;
  },
  resize: defaultResizeConfig,
  linking: defaultLinkingConfig,
  grouping: defaultGroupingConfig,
  zoom: defaultZoomConfig,
  background: defaultBackgroundConfig,
  treeLayout: defaultTreeLayoutConfig,
  nodeRotation: defaultNodeRotationConfig,
  snapping: defaultNodeDraggingConfig,
  selectionMoving: defaultSelectionMovingConfig,
  edgeRouting: defaultEdgeRoutingConfig,
};
