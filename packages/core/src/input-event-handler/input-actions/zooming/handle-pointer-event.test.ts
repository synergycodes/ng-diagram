import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { FlowCore } from '../../../flow-core';
import { getSamplePointerEvent } from '../../../test-utils';
import { handlePointerEvent } from './handle-pointer-event';

describe('handlePointerEvent', () => {
  let mockFlowCore: FlowCore;
  let getStateMock: Mock;

  beforeEach(() => {
    getStateMock = vi.fn().mockReturnValue({ metadata: { viewport: { x: 0, y: 0, scale: 1 } } });
    mockFlowCore = {
      getState: getStateMock,
      commandHandler: { emit: vi.fn() },
    } as unknown as FlowCore;
  });

  afterEach(() => {
    handlePointerEvent(getSamplePointerEvent({ type: 'pointerup', pointerId: 1 }), mockFlowCore);
    handlePointerEvent(getSamplePointerEvent({ type: 'pointerup', pointerId: 2 }), mockFlowCore);
  });

  it('should handle pinch zoom with two pointers', () => {
    handlePointerEvent(getSamplePointerEvent({ type: 'pointerdown', pointerId: 1, x: 200, y: 100 }), mockFlowCore);
    handlePointerEvent(getSamplePointerEvent({ type: 'pointerdown', pointerId: 2, x: 100, y: 200 }), mockFlowCore);

    handlePointerEvent(getSamplePointerEvent({ type: 'pointermove', pointerId: 1, x: 250, y: 50 }), mockFlowCore);
    handlePointerEvent(getSamplePointerEvent({ type: 'pointermove', pointerId: 2, x: 50, y: 250 }), mockFlowCore);

    expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('zoom', {
      scale: 1.05,
      x: -8.75000000000001,
      y: -6.2500000000000115,
    });
  });

  it('should not exceed maximum scale limit during pinch zoom', () => {
    getStateMock.mockReturnValue({ metadata: { viewport: { x: 0, y: 0, scale: 10 } } });

    handlePointerEvent(getSamplePointerEvent({ type: 'pointerdown', pointerId: 1, x: 200, y: 100 }), mockFlowCore);
    handlePointerEvent(getSamplePointerEvent({ type: 'pointerdown', pointerId: 2, x: 100, y: 200 }), mockFlowCore);

    handlePointerEvent(getSamplePointerEvent({ type: 'pointermove', pointerId: 1, x: 250, y: 50 }), mockFlowCore);
    handlePointerEvent(getSamplePointerEvent({ type: 'pointermove', pointerId: 2, x: 50, y: 250 }), mockFlowCore);

    expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('zoom', expect.objectContaining({ scale: 10 }));
  });

  it('should not go below minimum scale limit during pinch zoom', () => {
    getStateMock.mockReturnValue({ metadata: { viewport: { x: 0, y: 0, scale: 0.1 } } });

    handlePointerEvent(getSamplePointerEvent({ type: 'pointerdown', pointerId: 1, x: 250, y: 50 }), mockFlowCore);
    handlePointerEvent(getSamplePointerEvent({ type: 'pointerdown', pointerId: 2, x: 50, y: 50 }), mockFlowCore);

    handlePointerEvent(getSamplePointerEvent({ type: 'pointermove', pointerId: 1, x: 200, y: 100 }), mockFlowCore);
    handlePointerEvent(getSamplePointerEvent({ type: 'pointermove', pointerId: 2, x: 100, y: 200 }), mockFlowCore);

    expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('zoom', expect.objectContaining({ scale: 0.1 }));
  });

  it('should clean up after pointer up events', () => {
    handlePointerEvent(getSamplePointerEvent({ type: 'pointerdown', pointerId: 1, x: 200, y: 100 }), mockFlowCore);
    handlePointerEvent(getSamplePointerEvent({ type: 'pointerdown', pointerId: 2, x: 100, y: 200 }), mockFlowCore);

    handlePointerEvent(getSamplePointerEvent({ type: 'pointerup', pointerId: 1, x: 200, y: 100 }), mockFlowCore);

    handlePointerEvent(getSamplePointerEvent({ type: 'pointermove', pointerId: 1, x: 250, y: 50 }), mockFlowCore);
    handlePointerEvent(getSamplePointerEvent({ type: 'pointermove', pointerId: 2, x: 50, y: 250 }), mockFlowCore);

    expect(mockFlowCore.commandHandler.emit).not.toHaveBeenCalled();
  });
});
