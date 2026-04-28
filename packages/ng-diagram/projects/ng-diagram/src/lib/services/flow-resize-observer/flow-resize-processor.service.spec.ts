import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';
import { UpdatePortsService } from '../update-ports/update-ports.service';
import { BatchResizeObserverService, type ObservedElementMetadata } from './batched-resize-observer.service';
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
    actionStateManager: {
      isResizing: ReturnType<typeof vi.fn>;
      isRotating: ReturnType<typeof vi.fn>;
    };
  };
  let mockFlowCoreProvider: { provide: () => typeof mockFlowCore };
  let mockUpdatePortsService: {
    getPortData: ReturnType<typeof vi.fn>;
    getNodePortsData: ReturnType<typeof vi.fn>;
  };
  let mockBatchResizeObserver: {
    setBatchProcessor: ReturnType<typeof vi.fn>;
    getMetadata: ReturnType<typeof vi.fn>;
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
      setBatchProcessor: vi.fn(),
      getMetadata: vi.fn(),
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
    service['processAllResizes']([entry]);

    expect(mockInternalUpdater.applyPortChanges).toHaveBeenCalled();
  });

  it('should process node batch', () => {
    const entry = { target: {} } as ResizeObserverEntry;
    const metadata: ObservedElementMetadata = { type: 'node', nodeId: 'n1' };

    mockBatchResizeObserver.getMetadata.mockReturnValue(metadata);
    mockFlowCore.getNodeById.mockReturnValue({ size: { width: 1, height: 2 } });

    vi.spyOn(service as unknown as MockedFlowResizeBatchProcessorService, 'getBorderBoxSize').mockReturnValue({
      width: 10,
      height: 20,
    });
    service['isInitialized'] = true;
    service['processAllResizes']([entry]);

    expect(mockInternalUpdater.applyNodeSizes).toHaveBeenCalled();
    expect(mockInternalUpdater.applyPortChanges).toHaveBeenCalled();
  });

  it('should skip port measurement during active resize', () => {
    const entry = { target: {} } as ResizeObserverEntry;
    const metadata: ObservedElementMetadata = { type: 'node', nodeId: 'n1' };

    mockBatchResizeObserver.getMetadata.mockReturnValue(metadata);
    mockFlowCore.getNodeById.mockReturnValue({ size: { width: 1, height: 2 } });
    mockFlowCore.actionStateManager.isResizing.mockReturnValue(true);

    vi.spyOn(service as unknown as MockedFlowResizeBatchProcessorService, 'getBorderBoxSize').mockReturnValue({
      width: 10,
      height: 20,
    });
    service['isInitialized'] = true;
    service['processAllResizes']([entry]);

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
    service['processAllResizes']([entry1, entry2]);

    expect(mockInternalUpdater.applyNodeSizes).toHaveBeenCalledTimes(1);
    expect(mockInternalUpdater.applyNodeSizes).toHaveBeenCalledWith([
      { id: 'n1', size: { width: 10, height: 20 } },
      { id: 'n2', size: { width: 10, height: 20 } },
    ]);
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
    service['processAllResizes']([entry]);

    expect(mockInternalUpdater.applyEdgeLabelChanges).toHaveBeenCalled();
  });

  it('should handle unknown metadata type', () => {
    const entry = { target: {} } as ResizeObserverEntry;
    const metadata = { type: 'unknown' } as unknown as ObservedElementMetadata;

    mockBatchResizeObserver.getMetadata.mockReturnValue(metadata);
    service['isInitialized'] = true;

    expect(() => service['processAllResizes']([entry])).toThrow();
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
