import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Node } from '../../../core/src';
import { CursorPositionTrackerService } from '../cursor-position-tracker/cursor-position-tracker.service';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';
import { LinkingEventService } from './linking-event.service';
import { ManualLinkingService } from './manual-linking.service';

describe('ManualLinkingService', () => {
  let service: ManualLinkingService;
  let emitContinue: ReturnType<typeof vi.fn>;
  let registerInteractionCleanup: ReturnType<typeof vi.fn>;
  let unregister: ReturnType<typeof vi.fn>;
  let registeredCleanups: (() => void)[];

  const node = { id: 'n1', type: 'node', position: { x: 0, y: 0 }, data: {} } as Node;

  beforeEach(() => {
    emitContinue = vi.fn();
    unregister = vi.fn();
    registeredCleanups = [];
    registerInteractionCleanup = vi.fn().mockImplementation((cleanup: () => void) => {
      registeredCleanups.push(cleanup);
      return unregister;
    });

    TestBed.configureTestingModule({
      providers: [
        ManualLinkingService,
        {
          provide: LinkingEventService,
          useValue: { emitStart: vi.fn(), emitContinue, emitEnd: vi.fn() },
        },
        {
          provide: CursorPositionTrackerService,
          useValue: { getLastPosition: () => ({ x: 0, y: 0 }) },
        },
        {
          provide: FlowCoreProviderService,
          useValue: { isInitialized: () => true, provide: () => ({ registerInteractionCleanup }) },
        },
      ],
    });

    service = TestBed.inject(ManualLinkingService);
  });

  it('registers an interaction cleanup when linking starts', () => {
    service.startLinking(node);

    expect(registerInteractionCleanup).toHaveBeenCalledTimes(1);
  });

  it('cleans up the previous linking when startLinking is called again mid-flight', () => {
    service.startLinking(node);
    service.startLinking(node);

    // The first registration must be released, not orphaned in FlowCore's registry
    expect(unregister).toHaveBeenCalledTimes(1);
    expect(registerInteractionCleanup).toHaveBeenCalledTimes(2);

    // Listeners are not stacked: one pointermove -> one continue
    document.dispatchEvent(new Event('pointermove'));
    expect(emitContinue).toHaveBeenCalledTimes(1);
  });

  it('the registered cleanup removes the document listeners', () => {
    service.startLinking(node);
    document.dispatchEvent(new Event('pointermove'));
    expect(emitContinue).toHaveBeenCalledTimes(1);

    registeredCleanups[0]();

    document.dispatchEvent(new Event('pointermove'));
    expect(emitContinue).toHaveBeenCalledTimes(1);
  });
});
