import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCoreProviderService } from '../../../services';
import { LinkingEventService } from '../../../services/input-events/linking-event.service';
import { TouchEventsStateService } from '../../../services/touch-events-state-service/touch-events-state-service.service';
import { DiagramEventName } from '../../../types';
import { LinkingInputDirective } from './linking.directive';

describe('LinkingInputDirective (shared touch marker ownership)', () => {
  let directive: LinkingInputDirective;
  let touchState: TouchEventsStateService;
  let clearLinking: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clearLinking = vi.fn();

    const mockLinkingEventService = {
      emitStart: vi.fn(),
      emitContinue: vi.fn(),
      emitEnd: vi.fn(),
    };
    const mockFlowCoreProvider = {
      isInitialized: () => true,
      provide: () => ({
        actionStateManager: { clearLinking, isLinking: () => false },
        registerInteractionCleanup: vi.fn().mockReturnValue(vi.fn()),
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        LinkingInputDirective,
        { provide: LinkingEventService, useValue: mockLinkingEventService },
        { provide: FlowCoreProviderService, useValue: mockFlowCoreProvider },
        TouchEventsStateService,
      ],
    });

    directive = TestBed.inject(LinkingInputDirective);
    touchState = TestBed.inject(TouchEventsStateService);
  });

  it('leaves a marker owned by another gesture alone when destroyed as a bystander', () => {
    // Simulates virtualization destroying this port's component during a touch pan
    touchState.currentEvent.set(DiagramEventName.Panning);

    directive.ngOnDestroy();

    expect(touchState.currentEvent()).toBe(DiagramEventName.Panning);
    expect(clearLinking).not.toHaveBeenCalled();
  });
});
