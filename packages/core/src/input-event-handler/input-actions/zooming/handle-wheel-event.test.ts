import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { FlowCore } from '../../../flow-core';
import { getSampleWheelEvent } from '../../../test-utils';
import { handleWheelEvent } from './handle-wheel-event';

describe('handleWheelEvent', () => {
  let mockFlowCore: FlowCore;
  let getStateMock: Mock;

  beforeEach(() => {
    getStateMock = vi.fn().mockReturnValue({ metadata: { viewport: { x: 0, y: 0, scale: 1 } } });
    mockFlowCore = {
      getState: getStateMock,
      commandHandler: { emit: vi.fn() },
    } as unknown as FlowCore;
  });

  it('should zoom in when wheel delta is negative', () => {
    handleWheelEvent(getSampleWheelEvent({ x: 100, y: 100, deltaY: -10 }), mockFlowCore);

    expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('zoom', {
      x: -4.999999999999997,
      y: -4.999999999999997,
      scale: 1.05,
    });
  });

  it('should zoom out when wheel delta is positive', () => {
    handleWheelEvent(getSampleWheelEvent({ x: 100, y: 100, deltaY: 10 }), mockFlowCore);

    expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('zoom', {
      x: 5.000000000000007,
      y: 5.000000000000007,
      scale: 0.95,
    });
  });

  it('should not exceed maximum scale limit', () => {
    getStateMock.mockReturnValue({ metadata: { viewport: { x: 0, y: 0, scale: 10 } } });

    handleWheelEvent(getSampleWheelEvent({ x: 100, y: 100, deltaY: -10 }), mockFlowCore);

    expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('zoom', { x: 0, y: 0, scale: 10 });
  });

  it('should not go below minimum scale limit', () => {
    getStateMock.mockReturnValue({ metadata: { viewport: { x: 0, y: 0, scale: 0.1 } } });

    handleWheelEvent(getSampleWheelEvent({ x: 100, y: 100, deltaY: 10 }), mockFlowCore);

    expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('zoom', { x: 0, y: 0, scale: 0.1 });
  });
});
