import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEnvironment, mockNode } from '../../../test-utils';
import type { LinkingActionState } from '../../../types/action-state.interface';
import { LinkingInputEvent } from './linking.event';
import { LINKING_MISSING_TARGET_ERROR, LinkingEventHandler } from './linking.handler';

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
    panningForce: null,
    ...overrides,
  };
}

describe('LinkingEventHandler', () => {
  const mockCommandHandler = { emit: vi.fn() };
  const mockActionStateManager = {
    linking: undefined as LinkingActionState | undefined,
    clearLinking: vi.fn(),
    isLinking: vi.fn(),
  };
  let mockFlowCore: FlowCore;
  let instance: LinkingEventHandler;
  const mockClientToFlowPosition = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockClientToFlowPosition.mockImplementation((args) => args);

    mockFlowCore = {
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
      actionStateManager: mockActionStateManager,
      clientToFlowPosition: mockClientToFlowPosition,
      config: { viewportPanningEnabled: true },
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
          sourceNodeId: 'node-1',
          sourcePortId: 'port-1',
          temporaryEdge: null,
        });
      });

      it('should throw error if target is null', () => {
        const event = getSampleLinkingEvent({
          phase: 'start',
          target: undefined,
          portId: 'port-1',
        });

        expect(() => instance.handle(event)).toThrow(LINKING_MISSING_TARGET_ERROR(event));
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

        mockActionStateManager.linking = { sourceNodeId: 'node-1', sourcePortId: 'port-1', temporaryEdge: null };
        mockActionStateManager.isLinking.mockReturnValue(true);
      });

      it('should emit moveTemporaryEdge command with converted position', () => {
        const clientPosition = { x: 100, y: 100 };
        const flowPosition = { x: 150, y: 150 };
        mockClientToFlowPosition.mockReturnValue(flowPosition);

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
        mockActionStateManager.linking = undefined;
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
      beforeEach(() => {
        // Start linking first
        const startEvent = getSampleLinkingEvent({
          phase: 'start',
          target: { ...mockNode, id: 'node-1' },
          portId: 'port-1',
        });
        instance.handle(startEvent);
        vi.clearAllMocks();

        mockActionStateManager.linking = { sourceNodeId: 'node-1', sourcePortId: 'port-1', temporaryEdge: null };
        mockActionStateManager.isLinking.mockReturnValue(true);
      });

      it('should emit finishLinking command with converted position and call clearLinking', () => {
        const clientPosition = { x: 200, y: 200 };
        const flowPosition = { x: 250, y: 250 };
        mockClientToFlowPosition.mockReturnValue(flowPosition);

        const event = getSampleLinkingEvent({
          phase: 'end',
          lastInputPoint: clientPosition,
        });

        instance.handle(event);

        expect(mockClientToFlowPosition).toHaveBeenCalledWith(clientPosition);
        expect(mockCommandHandler.emit).toHaveBeenCalledWith('finishLinking', {
          position: flowPosition,
        });
        expect(mockActionStateManager.clearLinking).toHaveBeenCalled();
      });

      it('should not emit when not linking', () => {
        mockActionStateManager.linking = undefined;
        mockActionStateManager.isLinking.mockReturnValue(false);

        const event = getSampleLinkingEvent({
          phase: 'end',
          lastInputPoint: { x: 100, y: 100 },
        });

        instance.handle(event);

        expect(mockCommandHandler.emit).not.toHaveBeenCalled();
        expect(mockFlowCore.actionStateManager.clearLinking).not.toHaveBeenCalled();
      });
    });

    describe('Panning behavior', () => {
      let mockFlowCore: FlowCore;
      let instance: LinkingEventHandler;
      const mockCommandHandler = { emit: vi.fn() };
      const mockActionStateManager = {
        linking: {},
        clearLinking: vi.fn(),
        isLinking: vi.fn(),
      };
      const mockClientToFlowPosition = vi.fn();

      beforeEach(() => {
        vi.clearAllMocks();
        mockClientToFlowPosition.mockImplementation((args) => args);

        mockFlowCore = {
          commandHandler: mockCommandHandler,
          environment: mockEnvironment,
          actionStateManager: mockActionStateManager,
          clientToFlowPosition: mockClientToFlowPosition,
          config: { viewportPanningEnabled: true },
        } as unknown as FlowCore;

        instance = new LinkingEventHandler(mockFlowCore);
      });

      it('should emit moveViewportBy when panning is enabled and panningForce is present', () => {
        mockActionStateManager.linking = { sourceNodeId: 'node-1', sourcePortId: 'port-1', temporaryEdge: null };
        mockActionStateManager.isLinking.mockReturnValue(true);

        const event = getSampleLinkingEvent({
          phase: 'continue',
          panningForce: { x: 10, y: 5 },
        });

        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', { x: 10, y: 5 });
      });

      it('should NOT emit moveViewportBy when panning is disabled', () => {
        mockFlowCore.config.viewportPanningEnabled = false;
        mockActionStateManager.linking = { sourceNodeId: 'node-1', sourcePortId: 'port-1', temporaryEdge: null };
        mockActionStateManager.isLinking.mockReturnValue(true);

        const event = getSampleLinkingEvent({
          phase: 'continue',
          panningForce: { x: 10, y: 5 },
        });

        instance.handle(event);

        expect(mockCommandHandler.emit).not.toHaveBeenCalledWith('moveViewportBy', expect.anything());
      });
    });
  });
});
