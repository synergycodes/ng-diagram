import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NgDiagramViewportService } from '../../public-services/ng-diagram-viewport.service';
import { FlowCoreProviderService } from '../../services';
import { NgDiagramMinimapNavigationDirective } from './ng-diagram-minimap-navigation.directive';

function makePointerEvent(overrides: Partial<PointerEvent> = {}): PointerEvent {
  return {
    button: 0,
    pointerId: 1,
    clientX: 10,
    clientY: 10,
    preventDefault: vi.fn(),
    target: {
      setPointerCapture: vi.fn(),
      hasPointerCapture: vi.fn().mockReturnValue(true),
      releasePointerCapture: vi.fn(),
    },
    ...overrides,
  } as unknown as PointerEvent;
}

describe('NgDiagramMinimapNavigationDirective (cancel integration)', () => {
  let directive: NgDiagramMinimapNavigationDirective;
  let moveViewportBy: ReturnType<typeof vi.fn>;
  let clearPanning: ReturnType<typeof vi.fn>;
  let registerInteractionCleanup: ReturnType<typeof vi.fn>;
  let unregister: ReturnType<typeof vi.fn>;
  let registeredCleanups: (() => void)[];

  beforeEach(() => {
    moveViewportBy = vi.fn();
    clearPanning = vi.fn();
    unregister = vi.fn();
    registeredCleanups = [];
    registerInteractionCleanup = vi.fn().mockImplementation((cleanup: () => void) => {
      registeredCleanups.push(cleanup);
      return unregister;
    });

    const actionStateManager = { panning: undefined as { active: boolean } | undefined, clearPanning };

    TestBed.configureTestingModule({
      providers: [
        NgDiagramMinimapNavigationDirective,
        { provide: NgDiagramViewportService, useValue: { moveViewportBy } },
        {
          provide: FlowCoreProviderService,
          useValue: {
            isInitialized: () => true,
            provide: () => ({ actionStateManager, registerInteractionCleanup }),
          },
        },
      ],
    });

    directive = TestBed.inject(NgDiagramMinimapNavigationDirective);
  });

  it('registers an interaction cleanup when the drag starts, once per gesture', () => {
    directive.onPointerDown(makePointerEvent());
    directive.onPointerDown(makePointerEvent());

    expect(registerInteractionCleanup).toHaveBeenCalledTimes(1);
  });

  it('the registered cleanup stops the drag: listeners removed, pointer capture released', () => {
    const event = makePointerEvent();
    directive.onPointerDown(event);

    registeredCleanups[0]();

    expect(unregister).toHaveBeenCalledTimes(1);
    expect(
      (event.target as unknown as { releasePointerCapture: ReturnType<typeof vi.fn> }).releasePointerCapture
    ).toHaveBeenCalled();
    // Listeners are gone — a pointermove after the cancel moves nothing
    document.dispatchEvent(new Event('pointermove'));
    expect(moveViewportBy).not.toHaveBeenCalled();
  });

  it('normal pointerup unregisters the cleanup and clears the panning state', () => {
    directive.onPointerDown(makePointerEvent());

    document.dispatchEvent(new Event('pointerup'));

    expect(unregister).toHaveBeenCalledTimes(1);
    expect(clearPanning).toHaveBeenCalled();
  });

  it('destroy mid-drag clears the panning state it set', () => {
    directive.onPointerDown(makePointerEvent());

    directive.ngOnDestroy();

    expect(unregister).toHaveBeenCalledTimes(1);
    expect(clearPanning).toHaveBeenCalled();
  });
});
