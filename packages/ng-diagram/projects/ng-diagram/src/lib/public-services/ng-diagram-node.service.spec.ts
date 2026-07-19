import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCoreProviderService } from '../services/flow-core-provider/flow-core-provider.service';
import { NgDiagramNodeService } from './ng-diagram-node.service';

describe('NgDiagramNodeService', () => {
  let service: NgDiagramNodeService;
  let mockEmit: ReturnType<typeof vi.fn>;
  let mockTransaction: ReturnType<typeof vi.fn>;
  let mockIsActive: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockEmit = vi.fn().mockResolvedValue(undefined);
    mockTransaction = vi.fn().mockImplementation(async (_name: string, callback: (tx: unknown) => Promise<void>) => {
      await callback({ emit: mockEmit });
      return { results: {}, commandsCount: 1, actionTypes: [] };
    });
    mockIsActive = vi.fn().mockReturnValue(false);

    const mockFlowCore = {
      commandHandler: { emit: mockEmit },
      transaction: mockTransaction,
      transactionManager: { isActive: mockIsActive },
    };

    TestBed.configureTestingModule({
      providers: [
        NgDiagramNodeService,
        { provide: FlowCoreProviderService, useValue: { provide: () => mockFlowCore } },
      ],
    });

    service = TestBed.inject(NgDiagramNodeService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should route resizeNode with waitForMeasurements through a NAMED transaction', async () => {
    await service.resizeNode('node-1', { width: 100, height: 50 }, undefined, undefined, {
      waitForMeasurements: true,
    });

    expect(mockTransaction).toHaveBeenCalledWith('resizeNode', expect.any(Function), { waitForMeasurements: true });
    expect(mockEmit).toHaveBeenCalledWith('resizeNode', {
      id: 'node-1',
      size: { width: 100, height: 50 },
      position: undefined,
      disableAutoSize: undefined,
    });
  });

  it('should ignore waitForMeasurements inside an active transaction and fall back to a plain emit', async () => {
    mockIsActive.mockReturnValue(true);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await service.resizeNode('node-1', { width: 100, height: 50 }, undefined, undefined, {
      waitForMeasurements: true,
    });

    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockEmit).toHaveBeenCalledWith('resizeNode', {
      id: 'node-1',
      size: { width: 100, height: 50 },
      position: undefined,
      disableAutoSize: undefined,
    });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('waitForMeasurements is ignored inside a transaction'));
  });
});
