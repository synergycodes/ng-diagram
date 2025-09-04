import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEnvironment, mockNode } from '../../../test-utils';
import type { Edge, LinkingState } from '../../../types';
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
  let mockCommandHandler: { emit: ReturnType<typeof vi.fn> };
  let mockActionStateManager: {
    linking: LinkingState | undefined;
    clearLinking: ReturnType<typeof vi.fn>;
    isLinking: ReturnType<typeof vi.fn>;
  };
  let mockFlowCore: FlowCore;
  let instance: LinkingEventHandler;
  let mockClientToFlowPosition: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockClientToFlowPosition = vi.fn().mockImplementation((args) => args);
    mockCommandHandler = { emit: vi.fn() };
    mockActionStateManager = {
      linking: undefined,
      clearLinking: vi.fn(),
      isLinking: vi.fn(),
    };

    mockFlowCore = {
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
      actionStateManager: mockActionStateManager,
      clientToFlowPosition: mockClientToFlowPosition,
    } as unknown as FlowCore;

    instance = new LinkingEventHandler(mockFlowCore);
  });

  describe('handle', () => {
    describe('start phase', () => {
      it('should emit startLinking command when phase is start', () => {
        const spy = vi.spyOn(mockFlowCore.actionStateManager, 'linking', 'set');

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

        expect(spy).toHaveBeenCalledWith({
          temporaryEdge: null,
          sourceNodeId: 'node-1',
          sourcePortId: 'port-1',
        });
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
      it('should emit moveTemporaryEdge command with converted position', () => {
        const clientPosition = { x: 100, y: 100 };
        const flowPosition = { x: 150, y: 150 };
        mockClientToFlowPosition.mockReturnValue(flowPosition);
        mockActionStateManager.isLinking.mockReturnValue(true);

        const event = getSampleLinkingEvent({
          phase: 'continue',
          lastInputPoint: clientPosition,
        });

        instance.handle(event);

        expect(mockClientToFlowPosition).toHaveBeenCalledWith(clientPosition);
        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveTemporaryEdge', {
          position: flowPosition,
        });
      });

      it('should not emit when not linking', () => {
        mockActionStateManager.isLinking.mockReturnValue(false);

        const event = getSampleLinkingEvent({
          phase: 'continue',
          lastInputPoint: { x: 100, y: 100 },
        });

        instance.handle(event);

        expect(mockCommandHandler.emit).not.toHaveBeenCalled();
      });
    });

    describe('end phase', () => {
      it('should emit finishLinking command when temporary edge has target', () => {
        const clientPosition = { x: 200, y: 200 };
        const flowPosition = { x: 250, y: 250 };
        mockClientToFlowPosition.mockReturnValue(flowPosition);
        mockActionStateManager.isLinking.mockReturnValue(true);
        mockActionStateManager.linking = {
          sourceNodeId: 'node-1',
          sourcePortId: 'port-1',
          temporaryEdge: { target: 'some-target' } as Edge,
        };

        const event = getSampleLinkingEvent({
          phase: 'end',
          lastInputPoint: clientPosition,
        });

        instance.handle(event);

        expect(mockClientToFlowPosition).not.toHaveBeenCalled();
        expect(mockCommandHandler.emit).toHaveBeenCalledWith('finishLinking');
        expect(mockActionStateManager.clearLinking).toHaveBeenCalled();
      });

      it('should emit finishLinkingToPosition command when temporary edge has no target', () => {
        const clientPosition = { x: 200, y: 200 };
        const flowPosition = { x: 250, y: 250 };
        mockClientToFlowPosition.mockReturnValue(flowPosition);
        mockActionStateManager.isLinking.mockReturnValue(true);
        mockActionStateManager.linking = {
          sourceNodeId: 'node-1',
          sourcePortId: 'port-1',
          temporaryEdge: { target: '' } as Edge,
        };

        const event = getSampleLinkingEvent({
          phase: 'end',
          lastInputPoint: clientPosition,
        });

        instance.handle(event);

        expect(mockClientToFlowPosition).toHaveBeenCalledWith(clientPosition);
        expect(mockCommandHandler.emit).toHaveBeenCalledWith('finishLinkingToPosition', {
          position: flowPosition,
        });
        expect(mockActionStateManager.clearLinking).toHaveBeenCalled();
      });

      it('should not emit when not linking', () => {
        mockActionStateManager.isLinking.mockReturnValue(false);

        const event = getSampleLinkingEvent({
          phase: 'end',
          lastInputPoint: { x: 100, y: 100 },
        });

        instance.handle(event);

        expect(mockCommandHandler.emit).not.toHaveBeenCalled();
        expect(mockActionStateManager.clearLinking).not.toHaveBeenCalled();
      });
    });
  });
});
