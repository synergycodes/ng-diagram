import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Node } from '../../core/src';
import { FlowCoreProviderService } from '../services/flow-core-provider/flow-core-provider.service';
import { NgDiagramModelService } from './ng-diagram-model.service';
import { NgDiagramService } from './ng-diagram.service';

describe('NgDiagramModelService', () => {
  let service: NgDiagramModelService;
  let mockEmit: ReturnType<typeof vi.fn>;
  let mockTransaction: ReturnType<typeof vi.fn>;
  let mockIsActive: ReturnType<typeof vi.fn>;
  let mockProvide: ReturnType<typeof vi.fn>;

  const nodes: Node[] = [{ id: 'node-1', position: { x: 0, y: 0 }, data: {} }];

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
    mockProvide = vi.fn().mockReturnValue(mockFlowCore);

    TestBed.configureTestingModule({
      providers: [
        NgDiagramModelService,
        { provide: NgDiagramService, useValue: { isInitialized: () => false } },
        {
          provide: FlowCoreProviderService,
          useValue: { provide: mockProvide, isInitialized: () => false },
        },
      ],
    });

    service = TestBed.inject(NgDiagramModelService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw synchronously when the diagram is not initialized', () => {
    mockProvide.mockImplementation(() => {
      throw new Error('NgDiagram is not initialized');
    });

    // Pre-awaitable behavior: an uninitialized engine throws synchronously —
    // it must not become an unhandled promise rejection on fire-and-forget calls.
    expect(() => service.addNodes(nodes)).toThrow('NgDiagram is not initialized');
    expect(() => service.addNodes(nodes, { waitForMeasurements: true })).toThrow('NgDiagram is not initialized');
  });

  it('should emit the command and resolve for a plain call', async () => {
    await service.addNodes(nodes);

    expect(mockEmit).toHaveBeenCalledWith('addNodes', { nodes });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('should route waitForMeasurements through a NAMED transaction so modelActionType keeps the command name', async () => {
    await service.addNodes(nodes, { waitForMeasurements: true });

    expect(mockTransaction).toHaveBeenCalledWith('addNodes', expect.any(Function), { waitForMeasurements: true });
    expect(mockEmit).toHaveBeenCalledWith('addNodes', { nodes });
  });

  it('should ignore waitForMeasurements inside an active transaction and fall back to a plain emit', async () => {
    mockIsActive.mockReturnValue(true);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await service.addNodes(nodes, { waitForMeasurements: true });

    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockEmit).toHaveBeenCalledWith('addNodes', { nodes });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('waitForMeasurements is ignored inside a transaction'));
  });

  it('should apply the same transaction guard to update methods', async () => {
    mockIsActive.mockReturnValue(true);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await service.updateNode('node-1', { position: { x: 5, y: 5 } }, { waitForMeasurements: true });

    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockEmit).toHaveBeenCalledWith('updateNode', { id: 'node-1', nodeChanges: { position: { x: 5, y: 5 } } });
  });
});
