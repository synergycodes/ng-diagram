import { LayoutAlignmentType, LayoutAngleType } from '../types';
import type { Edge } from '../types/edge.interface';
import type {
  FlowConfig,
  GroupingConfig,
  LinkingConfig,
  NodeRotationConfig,
  ResizeConfig,
  TreeLayoutConfig,
  ZoomConfig,
} from '../types/flow-config.interface';
import { Size } from '../types/utils';

const defaultComputeNodeId = (): string => {
  return crypto.randomUUID();
};

const defaultComputeEdgeId = (): string => {
  return crypto.randomUUID();
};

const defaultResizeConfig: ResizeConfig = {
  getMinNodeSize: (): Size => ({
    width: 100,
    height: 100,
  }),
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
  treeLayout: defaultTreeLayoutConfig,
  nodeRotation: defaultNodeRotationConfig,
};
