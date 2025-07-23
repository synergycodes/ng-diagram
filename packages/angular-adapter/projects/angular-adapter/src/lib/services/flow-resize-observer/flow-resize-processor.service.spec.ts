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
    applyPortsSizesAndPositions: ReturnType<typeof vi.fn>;
    applyNodeSize: ReturnType<typeof vi.fn>;
    applyEdgeLabelSize: ReturnType<typeof vi.fn>;
  };
  let mockFlowCore: {
    updater: typeof mockInternalUpdater;
    getNodeById: ReturnType<typeof vi.fn>;
    getEdgeById: ReturnType<typeof vi.fn>;
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
      applyPortsSizesAndPositions: vi.fn(),
      applyNodeSize: vi.fn(),
      applyEdgeLabelSize: vi.fn(),
    };
    mockFlowCore = {
      updater: mockInternalUpdater,
      getNodeById: vi.fn(),
      getEdgeById: vi.fn(),
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
      ports: [{ id: 'p1', size: { width: 1, height: 2 }, position: { x: 1, y: 2 } }],
    });

    vi.spyOn(service as unknown as MockedFlowResizeBatchProcessorService, 'getBorderBoxSize').mockReturnValue({
      width: 10,
      height: 20,
    });
    service['isInitialized'] = true;
    service['processAllResizes']([entry]);

    expect(mockInternalUpdater.applyPortsSizesAndPositions).toHaveBeenCalled();
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

    expect(mockInternalUpdater.applyNodeSize).toHaveBeenCalled();
    expect(mockInternalUpdater.applyPortsSizesAndPositions).toHaveBeenCalled();
  });

  it('should process edge label batch', () => {
    const entry = { target: {} } as ResizeObserverEntry;
    const metadata: ObservedElementMetadata = {
      type: 'edge-label',
      edgeId: 'e1',
      labelId: 'l1',
    };

    mockBatchResizeObserver.getMetadata.mockReturnValue(metadata);
    mockFlowCore.getEdgeById.mockReturnValue({ labels: [{ id: 'l1', size: { width: 1, height: 2 } }] });
    vi.spyOn(service as unknown as MockedFlowResizeBatchProcessorService, 'getBorderBoxSize').mockReturnValue({
      width: 10,
      height: 20,
    });

    service['isInitialized'] = true;
    service['processAllResizes']([entry]);

    expect(mockInternalUpdater.applyEdgeLabelSize).toHaveBeenCalled();
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
