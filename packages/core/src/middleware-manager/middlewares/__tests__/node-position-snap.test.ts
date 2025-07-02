import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FlowCore } from '../../../flow-core';
import { mockNode } from '../../../test-utils';
import type { Metadata, MiddlewareContext, MiddlewaresConfigFromMiddlewares, Node } from '../../../types';
import { snapNumber } from '../../../utils';
import type { MiddlewareExecutor } from '../../middleware-executor';
import { nodePositionSnapMiddleware, NodePositionSnapMiddlewareMetadata } from '../node-position-snap';

type Helpers = ReturnType<MiddlewareExecutor<[], Metadata<MiddlewaresConfigFromMiddlewares<[]>>>['helpers']>;

const SNAP_GRID = 10;

describe('nodePositionSnapMiddleware', () => {
  let helpers: Partial<Helpers>;
  let nodesMap: Map<string, Node>;
  let flowCore: Pick<FlowCore, 'getNodeById'>;
  let context: MiddlewareContext<
    [],
    Metadata<MiddlewaresConfigFromMiddlewares<[]>>,
    NodePositionSnapMiddlewareMetadata
  >;
  let nextMock: ReturnType<typeof vi.fn>;
  let cancelMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    helpers = {
      checkIfAnyNodePropsChanged: vi.fn(),
      getAffectedNodeIds: vi.fn(),
    };
    nodesMap = new Map();
    flowCore = {
      getNodeById: vi.fn(),
    };
    nextMock = vi.fn();
    cancelMock = vi.fn();
    context = {
      helpers: helpers as Helpers,
      nodesMap,
      flowCore: flowCore as FlowCore,
      middlewareMetadata: {
        snap: { x: SNAP_GRID, y: SNAP_GRID },
      },
    } as unknown as MiddlewareContext<
      [],
      Metadata<MiddlewaresConfigFromMiddlewares<[]>>,
      NodePositionSnapMiddlewareMetadata
    >;
  });

  it('should call next if no position property changed', () => {
    (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);

    nodePositionSnapMiddleware.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith();
  });

  it('should call cancel if no nodes need snapping', () => {
    (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);
    nodesMap.set('node1', { ...mockNode, id: 'node1', position: { x: 10, y: 20 } });
    (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
      id: 'node1',
      position: { x: snapNumber(10, SNAP_GRID), y: snapNumber(20, SNAP_GRID) },
    });

    nodePositionSnapMiddleware.execute(context, nextMock, cancelMock);

    expect(cancelMock).toHaveBeenCalled();
    expect(nextMock).not.toHaveBeenCalledWith(expect.objectContaining({ nodesToUpdate: expect.anything() }));
  });

  it('should skip nodes not found in nodesMap', () => {
    (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1', 'node2']);
    nodesMap.set('node1', { ...mockNode, id: 'node1', position: { x: 13, y: 17 } });
    // node2 is not set
    (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({ id: 'node1', position: { x: 13, y: 17 } });

    nodePositionSnapMiddleware.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith({
      nodesToUpdate: [{ id: 'node1', position: { x: snapNumber(13, SNAP_GRID), y: snapNumber(17, SNAP_GRID) } }],
    });
  });

  it('should snap position if not snapped and update state', () => {
    (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);
    nodesMap.set('node1', { ...mockNode, id: 'node1', position: { x: 13, y: 17 } });
    (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({ id: 'node1', position: { x: 13, y: 17 } });

    nodePositionSnapMiddleware.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith({
      nodesToUpdate: [{ id: 'node1', position: { x: snapNumber(13, SNAP_GRID), y: snapNumber(17, SNAP_GRID) } }],
    });
  });

  it('should not update if position is already snapped', () => {
    (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);
    nodesMap.set('node1', { ...mockNode, id: 'node1', position: { x: 10, y: 20 } });
    (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({ id: 'node1', position: { x: 10, y: 20 } });
    nodePositionSnapMiddleware.execute(context, nextMock, cancelMock);
    expect(cancelMock).toHaveBeenCalled();
    expect(nextMock).not.toHaveBeenCalledWith(expect.objectContaining({ nodesToUpdate: expect.anything() }));
  });

  it('should handle multiple nodes, only updating those needing snap', () => {
    (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1', 'node2']);
    nodesMap.set('node1', { ...mockNode, id: 'node1', position: { x: 13, y: 17 } });
    nodesMap.set('node2', { ...mockNode, id: 'node2', position: { x: 10, y: 20 } });
    (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockImplementation((id: string) => ({
      id,
      position: nodesMap.get(id)?.position,
    }));

    nodePositionSnapMiddleware.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith({
      nodesToUpdate: [{ id: 'node1', position: { x: snapNumber(13, SNAP_GRID), y: snapNumber(17, SNAP_GRID) } }],
    });
  });

  it('should call cancel if nodesToUpdate is empty', () => {
    (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);
    nodesMap.set('node1', { ...mockNode, id: 'node1', position: { x: 10, y: 20 } });
    (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({ id: 'node1', position: { x: 10, y: 20 } });

    nodePositionSnapMiddleware.execute(context, nextMock, cancelMock);

    expect(cancelMock).toHaveBeenCalled();
  });
});
