import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FlowCore } from '../../../flow-core';
import { snapAngle } from '../../../input-events/handlers/rotate/snap-angle';
import { mockNode } from '../../../test-utils';
import type { Metadata, MiddlewareContext, MiddlewaresConfigFromMiddlewares, Node } from '../../../types';
import { nodeRotationSnapMiddleware, NodeRotationSnapMiddlewareMetadata } from '../node-rotation-snap';

import type { MiddlewareExecutor } from '../../middleware-executor';

type Helpers = ReturnType<MiddlewareExecutor<[], Metadata<MiddlewaresConfigFromMiddlewares<[]>>>['helpers']>;

const SNAP_ANGLE = 15;

describe('nodeRotationSnapMiddleware', () => {
  let helpers: Partial<Helpers>;
  let nodesMap: Map<string, Node>;
  let flowCore: Pick<FlowCore, 'getNodeById' | 'config'>;
  let context: MiddlewareContext<
    [],
    Metadata<MiddlewaresConfigFromMiddlewares<[]>>,
    NodeRotationSnapMiddlewareMetadata
  >;
  let nextMock: ReturnType<typeof vi.fn>;
  let cancelMock: ReturnType<typeof vi.fn>;
  let shouldSnapForNodeMock: ReturnType<typeof vi.fn>;
  let computeSnapAngleForNodeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    helpers = {
      checkIfAnyNodePropsChanged: vi.fn(),
      getAffectedNodeIds: vi.fn(),
    };
    nodesMap = new Map();

    shouldSnapForNodeMock = vi.fn().mockReturnValue(true);
    computeSnapAngleForNodeMock = vi.fn().mockReturnValue(SNAP_ANGLE);

    flowCore = {
      getNodeById: vi.fn(),
      config: {
        nodeRotation: {
          shouldSnapForNode: shouldSnapForNodeMock,
          computeSnapAngleForNode: computeSnapAngleForNodeMock,
        },
      },
    } as unknown as FlowCore;
    nextMock = vi.fn();
    cancelMock = vi.fn();
    context = {
      helpers: helpers as Helpers,
      nodesMap,
      flowCore: flowCore as FlowCore,
      middlewareMetadata: {
        enabled: true,
        snap: SNAP_ANGLE,
      },
    } as unknown as MiddlewareContext<
      [],
      Metadata<MiddlewaresConfigFromMiddlewares<[]>>,
      NodeRotationSnapMiddlewareMetadata
    >;
  });

  it('should call next if middleware is disabled', () => {
    context.middlewareMetadata.enabled = false;
    nodeRotationSnapMiddleware.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith();
    expect(helpers.checkIfAnyNodePropsChanged).not.toHaveBeenCalled();
  });

  it('should call next if no angle property changed', () => {
    (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
    nodeRotationSnapMiddleware.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith();
  });

  it('should call cancel if no nodes need snapping', () => {
    (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);
    nodesMap.set('node1', { ...mockNode, id: 'node1', angle: 30 });
    (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
      id: 'node1',
      angle: snapAngle(30, SNAP_ANGLE),
    });

    nodeRotationSnapMiddleware.execute(context, nextMock, cancelMock);

    expect(cancelMock).toHaveBeenCalled();
    expect(nextMock).not.toHaveBeenCalled();
  });

  it('should skip nodes without angle', () => {
    (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1', 'node2']);
    nodesMap.set('node1', { ...mockNode, id: 'node1' });
    nodesMap.set('node2', { ...mockNode, id: 'node2', angle: undefined });

    nodeRotationSnapMiddleware.execute(context, nextMock, cancelMock);

    expect(cancelMock).toHaveBeenCalled();
  });

  it('should skip nodes when shouldSnapForNode returns false', () => {
    (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);
    nodesMap.set('node1', { ...mockNode, id: 'node1', angle: 17 });
    shouldSnapForNodeMock.mockReturnValue(false);

    nodeRotationSnapMiddleware.execute(context, nextMock, cancelMock);

    expect(cancelMock).toHaveBeenCalled();
    expect(shouldSnapForNodeMock).toHaveBeenCalledWith({ ...mockNode, id: 'node1', angle: 17 });
    expect(nextMock).not.toHaveBeenCalled();
  });

  it('should snap angle if not snapped and update state', () => {
    (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);
    nodesMap.set('node1', { ...mockNode, id: 'node1', angle: 17 });
    (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({ id: 'node1', angle: 17 });

    nodeRotationSnapMiddleware.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith({ nodesToUpdate: [{ id: 'node1', angle: snapAngle(17, SNAP_ANGLE) }] });
  });

  it('should use computeSnapAngleForNode result when available', () => {
    const customSnapAngle = 10;
    (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);
    nodesMap.set('node1', { ...mockNode, id: 'node1', angle: 17 });
    (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({ id: 'node1', angle: 17 });
    computeSnapAngleForNodeMock.mockReturnValue(customSnapAngle);

    nodeRotationSnapMiddleware.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith({ nodesToUpdate: [{ id: 'node1', angle: snapAngle(17, customSnapAngle) }] });
    expect(computeSnapAngleForNodeMock).toHaveBeenCalledWith({ ...mockNode, id: 'node1', angle: 17 });
  });

  it('should fall back to middleware snap config when computeSnapAngleForNode returns null', () => {
    (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);
    nodesMap.set('node1', { ...mockNode, id: 'node1', angle: 17 });
    (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({ id: 'node1', angle: 17 });
    computeSnapAngleForNodeMock.mockReturnValue(null);

    nodeRotationSnapMiddleware.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith({ nodesToUpdate: [{ id: 'node1', angle: snapAngle(17, SNAP_ANGLE) }] });
  });

  it('should not update if angle is already snapped', () => {
    (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);
    nodesMap.set('node1', { ...mockNode, id: 'node1', angle: 30 });
    (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({ id: 'node1', angle: 30 });

    nodeRotationSnapMiddleware.execute(context, nextMock, cancelMock);

    expect(cancelMock).toHaveBeenCalled();
    expect(nextMock).not.toHaveBeenCalled();
  });

  it('should handle multiple nodes, only updating those needing snap', () => {
    (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1', 'node2']);
    nodesMap.set('node1', { ...mockNode, id: 'node1', angle: 17 });
    nodesMap.set('node2', { ...mockNode, id: 'node2', angle: 30 });
    (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockImplementation((id: string) => ({
      id,
      angle: nodesMap.get(id)?.angle,
    }));

    nodeRotationSnapMiddleware.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith({ nodesToUpdate: [{ id: 'node1', angle: snapAngle(17, SNAP_ANGLE) }] });
  });

  it('should call cancel if nodesToUpdate is empty', () => {
    (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);
    nodesMap.set('node1', { ...mockNode, id: 'node1', angle: 30 });
    (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({ id: 'node1', angle: 30 });

    nodeRotationSnapMiddleware.execute(context, nextMock, cancelMock);

    expect(cancelMock).toHaveBeenCalled();
  });
});
