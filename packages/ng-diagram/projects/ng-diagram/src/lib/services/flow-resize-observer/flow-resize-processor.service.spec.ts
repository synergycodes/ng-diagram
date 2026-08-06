import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';
import { UpdatePortsService } from '../update-ports/update-ports.service';
import {
  BatchResizeObserverService,
  type BatchResizeObserverConfig,
  type ObservedElementMetadata,
} from './batched-resize-observer.service';
import { FlowResizeBatchProcessorService } from './flow-resize-processor.service';

interface MockedFlowResizeBatchProcessorService {
  initialize: ReturnType<typeof vi.fn>;
  processAllResizes: ReturnType<typeof vi.fn>;
  getBorderBoxSize: ReturnType<typeof vi.fn>;
}

describe('FlowResizeBatchProcessorService', () => {
  let service: FlowResizeBatchProcessorService;
  let mockInternalUpdater: {
    applyPortChanges: ReturnType<typeof vi.fn>;
    applyNodeSize: ReturnType<typeof vi.fn>;
    applyNodeSizes: ReturnType<typeof vi.fn>;
    applyEdgeLabelChanges: ReturnType<typeof vi.fn>;
  };
  let mockFlowCore: {
    updater: typeof mockInternalUpdater;
    commandHandler: { emit: ReturnType<typeof vi.fn> };
    isInitialized: boolean;
    getNodeById: ReturnType<typeof vi.fn>;
    getEdgeById: ReturnType<typeof vi.fn>;
    eventManager: { on: ReturnType<typeof vi.fn> };
    actionStateManager: {
      isResizing: ReturnType<typeof vi.fn>;
      isRotating: ReturnType<typeof vi.fn>;
      resize?: { resizingNode: { id: string } };
    };
  };
  let mockFlowCoreProvider: { provide: () => typeof mockFlowCore };
  let mockUpdatePortsService: {
    getPortData: ReturnType<typeof vi.fn>;
    getNodePortsData: ReturnType<typeof vi.fn>;
  };
  let mockBatchResizeObserver: {
    configure: ReturnType<typeof vi.fn>;
    getMetadata: ReturnType<typeof vi.fn>;
    invalidateNode: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockInternalUpdater = {
      applyPortChanges: vi.fn(),
      applyNodeSize: vi.fn(),
      applyNodeSizes: vi.fn(),
      applyEdgeLabelChanges: vi.fn(),
    };
    mockFlowCore = {
      updater: mockInternalUpdater,
      commandHandler: { emit: vi.fn() },
      isInitialized: false,
      getNodeById: vi.fn(),
      getEdgeById: vi.fn(),
      eventManager: { on: vi.fn() },
      actionStateManager: {
        isResizing: vi.fn().mockReturnValue(false),
        isRotating: vi.fn().mockReturnValue(false),
      },
    };
    mockFlowCoreProvider = { provide: vi.fn().mockReturnValue(mockFlowCore) };
    mockUpdatePortsService = {
      getPortData: vi.fn().mockReturnValue({ position: { x: 1, y: 2 } }),
      getNodePortsData: vi
        .fn()
        .mockReturnValue([{ id: 'p1', size: { width: 1, height: 2 }, position: { x: 1, y: 2 } }]),
    };
    mockBatchResizeObserver = {
      configure: vi.fn(),
      getMetadata: vi.fn(),
      invalidateNode: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        FlowResizeBatchProcessorService,
        { provide: FlowCoreProviderService, useValue: mockFlowCoreProvider },
        { provide: UpdatePortsService, useValue: mockUpdatePortsService },
        {
          provide: BatchResizeObserverService,
          useValue: mockBatchResizeObserver,
        },
      ],
    });
    service = TestBed.inject(FlowResizeBatchProcessorService);
    service.initialize();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Arranges one observed node entry: metadata, model node, gesture state and the measured DOM size. */
  const arrangeNodeEntry = (
    nodeId: string,
    node: Record<string, unknown>,
    domSize: { width: number; height: number },
    isResizingNow = false
  ) => {
    mockBatchResizeObserver.getMetadata.mockReturnValue({ type: 'node', nodeId } as ObservedElementMetadata);
    mockFlowCore.getNodeById.mockReturnValue(node);
    mockFlowCore.actionStateManager.isResizing.mockReturnValue(isResizingNow);
    vi.spyOn(service as unknown as MockedFlowResizeBatchProcessorService, 'getBorderBoxSize').mockReturnValue(domSize);
  };

  it('should process port batch', () => {
    const entry = { target: {} } as ResizeObserverEntry;

    const metadata: ObservedElementMetadata = {
      type: 'port',
      nodeId: 'n1',
      portId: 'p1',
    };

    mockBatchResizeObserver.getMetadata.mockReturnValue(metadata);
    mockFlowCore.getNodeById.mockReturnValue({
      measuredPorts: [{ id: 'p1', size: { width: 1, height: 2 }, position: { x: 1, y: 2 } }],
    });

    vi.spyOn(service as unknown as MockedFlowResizeBatchProcessorService, 'getBorderBoxSize').mockReturnValue({
      width: 10,
      height: 20,
    });
    service['isInitialized'] = true;
    service['processAllResizes']([{ entry, resizingNodeId: undefined }]);

    expect(mockInternalUpdater.applyPortChanges).toHaveBeenCalled();
  });

  it('should process node batch', () => {
    const entry = { target: {} } as ResizeObserverEntry;
    arrangeNodeEntry('n1', { size: { width: 1, height: 2 } }, { width: 10, height: 20 });

    service['processAllResizes']([{ entry, resizingNodeId: undefined }]);

    expect(mockInternalUpdater.applyNodeSizes).toHaveBeenCalled();
    expect(mockInternalUpdater.applyPortChanges).toHaveBeenCalled();
  });

  it('should skip port measurement during active resize', () => {
    const entry = { target: {} } as ResizeObserverEntry;
    arrangeNodeEntry('n1', { size: { width: 1, height: 2 } }, { width: 10, height: 20 }, true);

    service['processAllResizes']([{ entry, resizingNodeId: undefined }]);

    expect(mockInternalUpdater.applyNodeSizes).toHaveBeenCalled();
    expect(mockInternalUpdater.applyPortChanges).not.toHaveBeenCalled();
  });

  it('should batch multiple node size updates into single applyNodeSizes call', () => {
    const entry1 = { target: { id: 't1' } } as unknown as ResizeObserverEntry;
    const entry2 = { target: { id: 't2' } } as unknown as ResizeObserverEntry;

    mockBatchResizeObserver.getMetadata
      .mockReturnValueOnce({ type: 'node', nodeId: 'n1' } as ObservedElementMetadata)
      .mockReturnValueOnce({ type: 'node', nodeId: 'n2' } as ObservedElementMetadata);
    mockFlowCore.getNodeById
      .mockReturnValueOnce({ size: { width: 1, height: 2 } })
      .mockReturnValueOnce({ size: { width: 3, height: 4 } });

    vi.spyOn(service as unknown as MockedFlowResizeBatchProcessorService, 'getBorderBoxSize').mockReturnValue({
      width: 10,
      height: 20,
    });
    service['isInitialized'] = true;
    service['processAllResizes']([
      { entry: entry1, resizingNodeId: undefined },
      { entry: entry2, resizingNodeId: undefined },
    ]);

    expect(mockInternalUpdater.applyNodeSizes).toHaveBeenCalledTimes(1);
    expect(mockInternalUpdater.applyNodeSizes).toHaveBeenCalledWith([
      { id: 'n1', size: { width: 10, height: 20 } },
      { id: 'n2', size: { width: 10, height: 20 } },
    ]);
  });

  it('should drop a resized-node entry captured during its gesture when processed after it ended', () => {
    const entry = { target: {} } as ResizeObserverEntry;
    // Fast release: gesture already over at processing time, model reverted to 100x50.
    arrangeNodeEntry('n1', { id: 'n1', size: { width: 100, height: 50 } }, { width: 300, height: 200 });

    service['processAllResizes']([{ entry, resizingNodeId: 'n1' }]);

    expect(mockInternalUpdater.applyNodeSizes).not.toHaveBeenCalled();
    expect(mockInternalUpdater.applyPortChanges).not.toHaveBeenCalled();
  });

  it('should drop a resized-node entry while its gesture is still active', () => {
    const entry = { target: {} } as ResizeObserverEntry;
    arrangeNodeEntry('n1', { id: 'n1', size: { width: 100, height: 50 } }, { width: 300, height: 200 }, true);

    service['processAllResizes']([{ entry, resizingNodeId: 'n1' }]);

    expect(mockInternalUpdater.applyNodeSizes).not.toHaveBeenCalled();
  });

  it('should apply a measurement of a different sized node captured during another node gesture', () => {
    const entry = { target: {} } as ResizeObserverEntry;
    arrangeNodeEntry('other', { id: 'other', size: { width: 80, height: 40 } }, { width: 120, height: 60 });

    service['processAllResizes']([{ entry, resizingNodeId: 'n1' }]);

    expect(mockInternalUpdater.applyNodeSizes).toHaveBeenCalledWith([
      { id: 'other', size: { width: 120, height: 60 } },
    ]);
  });

  it('should emit nothing for a batch holding a stale gesture entry and the current size of the same node', () => {
    const stale = { target: { id: 't-stale' } } as unknown as ResizeObserverEntry;
    const current = { target: { id: 't-current' } } as unknown as ResizeObserverEntry;
    arrangeNodeEntry('n1', { id: 'n1', size: { width: 100, height: 50 } }, { width: 300, height: 200 });
    (service['getBorderBoxSize'] as unknown as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce({ width: 300, height: 200 })
      .mockReturnValueOnce({ width: 100, height: 50 });

    service['processAllResizes']([
      { entry: stale, resizingNodeId: 'n1' },
      { entry: current, resizingNodeId: undefined },
    ]);

    expect(mockInternalUpdater.applyNodeSizes).not.toHaveBeenCalled();
  });

  it('should apply the initial size of a node without size even when captured during a resize gesture', () => {
    const entry = { target: {} } as ResizeObserverEntry;
    arrangeNodeEntry('n1', { id: 'n1' }, { width: 10, height: 20 });

    service['processAllResizes']([{ entry, resizingNodeId: 'n1' }]);

    expect(mockInternalUpdater.applyNodeSizes).toHaveBeenCalledWith([{ id: 'n1', size: { width: 10, height: 20 } }]);
  });

  it('should register a capture-time sampler reading the resizing node id from the action state', () => {
    const config: BatchResizeObserverConfig = mockBatchResizeObserver.configure.mock.calls[0][0];

    mockFlowCore.actionStateManager.resize = { resizingNode: { id: 'n9' } };
    expect(config.activeResizeNodeId()).toBe('n9');

    mockFlowCore.actionStateManager.resize = undefined;
    expect(config.activeResizeNodeId()).toBeUndefined();
  });

  describe('watchResizeGestureEnd', () => {
    const emitActionState = (resize?: { resizingNode: { id: string } }) => {
      const listener = mockFlowCore.eventManager.on.mock.calls[0][1];
      listener({ actionState: { resize } });
    };

    it('should re-measure the resized node exactly once when the gesture ends', () => {
      service.watchResizeGestureEnd();

      emitActionState({ resizingNode: { id: 'n1' } });
      expect(mockBatchResizeObserver.invalidateNode).not.toHaveBeenCalled();

      emitActionState(undefined);
      emitActionState(undefined);
      expect(mockBatchResizeObserver.invalidateNode).toHaveBeenCalledTimes(1);
      expect(mockBatchResizeObserver.invalidateNode).toHaveBeenCalledWith('n1');
    });

    it('should keep watching across consecutive gestures', () => {
      service.watchResizeGestureEnd();

      emitActionState({ resizingNode: { id: 'n1' } });
      emitActionState(undefined);
      emitActionState({ resizingNode: { id: 'n2' } });
      emitActionState(undefined);

      expect(mockBatchResizeObserver.invalidateNode).toHaveBeenNthCalledWith(1, 'n1');
      expect(mockBatchResizeObserver.invalidateNode).toHaveBeenNthCalledWith(2, 'n2');
    });
  });

  it('should process edge label batch', () => {
    const entry = { target: {} } as ResizeObserverEntry;
    const metadata: ObservedElementMetadata = {
      type: 'edge-label',
      edgeId: 'e1',
      labelId: 'l1',
    };

    mockBatchResizeObserver.getMetadata.mockReturnValue(metadata);
    mockFlowCore.getEdgeById.mockReturnValue({ measuredLabels: [{ id: 'l1', size: { width: 1, height: 2 } }] });
    vi.spyOn(service as unknown as MockedFlowResizeBatchProcessorService, 'getBorderBoxSize').mockReturnValue({
      width: 10,
      height: 20,
    });

    service['isInitialized'] = true;
    service['processAllResizes']([{ entry, resizingNodeId: undefined }]);

    expect(mockInternalUpdater.applyEdgeLabelChanges).toHaveBeenCalled();
  });

  it('should handle unknown metadata type', () => {
    const entry = { target: {} } as ResizeObserverEntry;
    const metadata = { type: 'unknown' } as unknown as ObservedElementMetadata;

    mockBatchResizeObserver.getMetadata.mockReturnValue(metadata);
    service['isInitialized'] = true;

    expect(() => service['processAllResizes']([{ entry, resizingNodeId: undefined }])).toThrow();
  });

  it('should get border box size', () => {
    const entry = {
      borderBoxSize: [{ inlineSize: 5, blockSize: 6 }],
    } as unknown as ResizeObserverEntry;
    const size = service['getBorderBoxSize'](entry);

    expect(size).toEqual({ width: 5, height: 6 });
  });

  it('should return null if no border box', () => {
    const entry = { borderBoxSize: [] } as unknown as ResizeObserverEntry;
    const size = service['getBorderBoxSize'](entry);

    expect(size).toBeNull();
  });
});
