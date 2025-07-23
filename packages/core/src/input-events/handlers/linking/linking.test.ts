import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEnvironment, mockNode, mockPort } from '../../../test-utils';
import { LinkingInputEvent } from './linking.event';
import { LinkingEventHandler } from './linking.handler';

function getSampleLinkingEvent(overrides: Partial<LinkingInputEvent> = {}): LinkingInputEvent {
  return {
    name: 'linking',
    id: 'test-id',
    timestamp: Date.now(),
    modifiers: {
      primary: false,
      secondary: false,
      shift: false,
      meta: false,
    },
    target: mockNode,
    targetType: 'node',
    lastInputPoint: { x: 100, y: 100 },
    phase: 'start',
    portId: 'port-1',
    ...overrides,
  };
}

describe('LinkingEventHandler', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockFlowCore: FlowCore;
  let instance: LinkingEventHandler;
  const mockGetState = vi.fn();
  const mockGetNearestPortInRange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockFlowCore = {
      getState: mockGetState,
      applyUpdate: vi.fn(),
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
      clientToFlowPosition: vi.fn().mockImplementation((args) => args),
      flowToClientPosition: vi.fn().mockImplementation((args) => args),
      getNearestPortInRange: mockGetNearestPortInRange,
    } as unknown as FlowCore;

    instance = new LinkingEventHandler(mockFlowCore);

    // Default state setup
    mockGetState.mockReturnValue({
      metadata: {},
    });
  });

  describe('handle', () => {
    describe('start phase', () => {
      it('should emit startLinking command when phase is start', () => {
        const event = getSampleLinkingEvent({
          phase: 'start',
          target: { ...mockNode, id: 'node-1' },
          portId: 'port-1',
        });

        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('startLinking', {
          source: 'node-1',
          sourcePort: 'port-1',
        });
        expect(instance.isLinking).toBe(true);
      });

      it('should throw error if target is null', () => {
        const event = getSampleLinkingEvent({
          phase: 'start',
          target: undefined,
          portId: 'port-1',
        });

        expect(() => instance.handle(event)).toThrow('Linking event must have a target Node');
      });
    });

    describe('continue phase', () => {
      beforeEach(() => {
        // Start linking first
        const startEvent = getSampleLinkingEvent({
          phase: 'start',
          target: { ...mockNode, id: 'node-1' },
          portId: 'port-1',
        });
        instance.handle(startEvent);
        vi.clearAllMocks();
      });

      it('should emit moveTemporaryEdge with empty target when no port is found nearby', () => {
        mockGetNearestPortInRange.mockReturnValue(null);

        const event = getSampleLinkingEvent({
          phase: 'continue',
          lastInputPoint: { x: 100, y: 100 },
        });

        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveTemporaryEdge', {
          position: { x: 100, y: 100 },
          target: '',
          targetPort: '',
        });
      });

      it('should emit moveTemporaryEdge with target port when valid target port is found', () => {
        const targetPort = { ...mockPort, type: 'target', nodeId: 'node-2', id: 'port-2' };
        mockGetNearestPortInRange.mockReturnValue(targetPort);
        mockGetState.mockReturnValue({
          metadata: {
            temporaryEdge: {
              source: 'node-1',
              sourcePort: 'port-1',
            },
          },
        });

        const event = getSampleLinkingEvent({
          phase: 'continue',
          lastInputPoint: { x: 100, y: 100 },
        });

        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveTemporaryEdge', {
          position: { x: 100, y: 100 },
          target: 'node-2',
          targetPort: 'port-2',
        });
      });

      it('should emit moveTemporaryEdge with empty target when found port is source type', () => {
        const sourcePort = { ...mockPort, type: 'source', nodeId: 'node-2', id: 'port-2' };
        mockGetNearestPortInRange.mockReturnValue(sourcePort);

        const event = getSampleLinkingEvent({
          phase: 'continue',
          lastInputPoint: { x: 100, y: 100 },
        });

        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveTemporaryEdge', {
          position: { x: 100, y: 100 },
          target: '',
          targetPort: '',
        });
      });

      it('should not emit when not linking', () => {
        instance.isLinking = false;

        const event = getSampleLinkingEvent({
          phase: 'continue',
          lastInputPoint: { x: 100, y: 100 },
        });

        instance.handle(event);

        expect(mockCommandHandler.emit).not.toHaveBeenCalled();
      });
    });

    describe('end phase', () => {
      beforeEach(() => {
        // Start linking first
        const startEvent = getSampleLinkingEvent({
          phase: 'start',
          target: { ...mockNode, id: 'node-1' },
          portId: 'port-1',
        });
        instance.handle(startEvent);
        vi.clearAllMocks();
      });

      it('should emit finishLinking with target from temporary edge', () => {
        mockGetState.mockReturnValue({
          metadata: {
            temporaryEdge: {
              source: 'node-1',
              sourcePort: 'port-1',
              target: 'node-2',
              targetPort: 'port-2',
            },
          },
        });

        const event = getSampleLinkingEvent({
          phase: 'end',
        });

        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('finishLinking', {
          target: 'node-2',
          targetPort: 'port-2',
        });
        expect(instance.isLinking).toBe(false);
      });

      it('should not emit when not linking', () => {
        instance.isLinking = false;

        const event = getSampleLinkingEvent({
          phase: 'end',
        });

        instance.handle(event);

        expect(mockCommandHandler.emit).not.toHaveBeenCalled();
      });
    });
  });
});
