import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FlowCore } from '../flow-core';
import { InteractionCoordinator } from './interaction-coordinator';

describe('InteractionCoordinator', () => {
  let coordinator: InteractionCoordinator;
  let cancel: ReturnType<typeof vi.fn>;
  let isActive: ReturnType<typeof vi.fn>;
  let gestureStates: { linking: boolean; dragging: boolean; resizing: boolean; rotating: boolean; panning: boolean };

  beforeEach(() => {
    cancel = vi.fn().mockResolvedValue(true);
    isActive = vi.fn().mockReturnValue(false);
    gestureStates = { linking: false, dragging: false, resizing: false, rotating: false, panning: false };

    const mockFlowCore = {
      actionStateManager: {
        isLinking: () => gestureStates.linking,
        isDragging: () => gestureStates.dragging,
        isResizing: () => gestureStates.resizing,
        isRotating: () => gestureStates.rotating,
        isPanning: () => gestureStates.panning,
      },
      transactionManager: { isActive },
      inputEventsRouter: { cancel },
    } as unknown as FlowCore;

    coordinator = new InteractionCoordinator(mockFlowCore);
  });

  it('should run the registered cleanups before cancelling the handlers', async () => {
    const callOrder: string[] = [];
    coordinator.registerInteractionCleanup(() => callOrder.push('cleanup'));
    cancel.mockImplementation(async (name: string) => {
      callOrder.push(`cancel:${name}`);
      return true;
    });
    gestureStates.dragging = true;

    await coordinator.cancelActiveInteraction();

    expect(callOrder).toEqual(['cleanup', 'cancel:pointerMoveSelection']);
  });

  it('should report cancelling only while a cancel is in flight', async () => {
    let release: () => void = () => undefined;
    cancel.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          release = () => resolve(true);
        })
    );
    gestureStates.resizing = true;

    expect(coordinator.isCancellingInteraction()).toBe(false);
    const cancelPromise = coordinator.cancelActiveInteraction();
    expect(coordinator.isCancellingInteraction()).toBe(true);

    release();
    await cancelPromise;
    expect(coordinator.isCancellingInteraction()).toBe(false);
  });

  it('should refuse while a transaction is active: warn, touch nothing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const cleanup = vi.fn();
    coordinator.registerInteractionCleanup(cleanup);
    gestureStates.dragging = true;
    isActive.mockReturnValue(true);

    expect(await coordinator.cancelActiveInteraction()).toBe(false);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('cancelActiveInteraction'));
    expect(cleanup).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
    expect(coordinator.hasActiveInteraction()).toBe(true);
    warn.mockRestore();
  });

  it('should return false from a re-entrant cancel without side effects', async () => {
    let release: () => void = () => undefined;
    cancel.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          release = () => resolve(true);
        })
    );
    gestureStates.panning = true;

    const first = coordinator.cancelActiveInteraction();
    const second = await coordinator.cancelActiveInteraction();

    expect(second).toBe(false);
    release();
    expect(await first).toBe(true);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('should release the latch when a handler cancel rejects', async () => {
    cancel.mockRejectedValue(new Error('handler failed'));
    gestureStates.rotating = true;

    await expect(coordinator.cancelActiveInteraction()).rejects.toThrow('handler failed');

    expect(coordinator.isCancellingInteraction()).toBe(false);
  });
});
