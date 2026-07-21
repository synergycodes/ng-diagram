import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCoreProviderService } from '../services/flow-core-provider/flow-core-provider.service';
import { NgDiagramClipboardService } from './ng-diagram-clipboard.service';

describe('NgDiagramClipboardService', () => {
  let service: NgDiagramClipboardService;
  let mockEmit: ReturnType<typeof vi.fn>;
  let mockTransaction: ReturnType<typeof vi.fn>;
  let mockIsActive: ReturnType<typeof vi.fn>;

  const position = { x: 10, y: 20 };

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
        NgDiagramClipboardService,
        { provide: FlowCoreProviderService, useValue: { provide: () => mockFlowCore } },
      ],
    });

    service = TestBed.inject(NgDiagramClipboardService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should emit a plain paste command without options', async () => {
    await service.paste(position);

    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockEmit).toHaveBeenCalledWith('paste', { position });
  });

  it('should route paste with waitForMeasurements through a NAMED transaction', async () => {
    await service.paste(position, { waitForMeasurements: true });

    expect(mockTransaction).toHaveBeenCalledWith('paste', expect.any(Function), { waitForMeasurements: true });
    expect(mockEmit).toHaveBeenCalledWith('paste', { position });
  });

  it('should ignore waitForMeasurements inside an active transaction and fall back to a plain emit', async () => {
    mockIsActive.mockReturnValue(true);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await service.paste(position, { waitForMeasurements: true });

    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockEmit).toHaveBeenCalledWith('paste', { position });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('waitForMeasurements is ignored inside a transaction'));
  });
});
