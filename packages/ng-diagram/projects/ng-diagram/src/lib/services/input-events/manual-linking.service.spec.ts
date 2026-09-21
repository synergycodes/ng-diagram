import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Node } from '../../../core/src';
import { CursorPositionTrackerService } from '../cursor-position-tracker/cursor-position-tracker.service';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';
import { LinkingEventService } from './linking-event.service';
import { LinkingGestureStateService } from './linking-gesture-state.service';
import { ManualLinkingService } from './manual-linking.service';

describe('ManualLinkingService', () => {
  let service: ManualLinkingService;
  let gestureState: LinkingGestureStateService;
  let emitStart: ReturnType<typeof vi.fn>;
  let emitContinue: ReturnType<typeof vi.fn>;
  let registerInteractionCleanup: ReturnType<typeof vi.fn>;
  let getNodeById: ReturnType<typeof vi.fn>;
  let isLinking: ReturnType<typeof vi.fn>;
  let unregister: ReturnType<typeof vi.fn>;
  let registeredCleanups: (() => void)[];

  const node = { id: 'n1', type: 'node', position: { x: 0, y: 0 }, data: {} } as Node;

  beforeEach(() => {
    emitStart = vi.fn();
    emitContinue = vi.fn();
    unregister = vi.fn();
    registeredCleanups = [];
    registerInteractionCleanup = vi.fn().mockImplementation((cleanup: () => void) => {
      registeredCleanups.push(cleanup);
      return unregister;
    });
    getNodeById = vi.fn().mockReturnValue(node);
    isLinking = vi.fn().mockReturnValue(false);

    TestBed.configureTestingModule({
      providers: [
        ManualLinkingService,
        LinkingGestureStateService,
        {
          provide: LinkingEventService,
          useValue: { emitStart, emitContinue, emitEnd: vi.fn() },
        },
        {
          provide: CursorPositionTrackerService,
          useValue: { getLastPosition: () => ({ x: 0, y: 0 }) },
        },
        {
          provide: FlowCoreProviderService,
          useValue: {
            isInitialized: () => true,
            provide: () => ({
              registerInteractionCleanup,
              getNodeById,
              actionStateManager: { isLinking },
              config: { danglingEdges: { enabled: true } },
              commandHandler: { emit: vi.fn() },
            }),
          },
        },
      ],
    });

    service = TestBed.inject(ManualLinkingService);
    gestureState = TestBed.inject(LinkingGestureStateService);
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

  it('refuses to start linking from an effectively hidden node without attaching listeners', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    getNodeById.mockReturnValue({ ...node, computedHidden: true });

    service.startLinking(node);

    // No emit, no listeners, no cleanup registration — the command would
    // refuse anyway and the listeners would be orphaned until the next click.
    expect(emitStart).not.toHaveBeenCalled();
    expect(registerInteractionCleanup).not.toHaveBeenCalled();
    document.dispatchEvent(new Event('pointermove'));
    expect(emitContinue).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('refuses to start linking when the node no longer exists in the model', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    getNodeById.mockReturnValue(undefined);

    service.startLinking(node);

    expect(emitStart).not.toHaveBeenCalled();
    expect(registerInteractionCleanup).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  describe('shared draw-gesture state', () => {
    it('is active from startLinking until the registered cleanup runs', () => {
      expect(gestureState.active()).toBe(false);

      service.startLinking(node);
      expect(gestureState.active()).toBe(true);

      registeredCleanups[0]();
      expect(gestureState.active()).toBe(false);
    });

    it('is active from startLinkingFromPosition until the finishing click', () => {
      service.startLinkingFromPosition({ x: 0, y: 0 });
      expect(gestureState.active()).toBe(true);

      document.dispatchEvent(new Event('click'));
      expect(gestureState.active()).toBe(false);
    });

    it('stays inactive when the start is refused because another gesture is in progress', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      isLinking.mockReturnValue(true);

      service.startLinking(node);
      service.startLinkingFromPosition({ x: 0, y: 0 });

      expect(gestureState.active()).toBe(false);
      warnSpy.mockRestore();
    });
  });
});
