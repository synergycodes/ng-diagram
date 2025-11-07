import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { PaletteDropInputEvent } from './palette-drop.event';
import { PaletteDropEventHandler } from './palette-drop.handler';

const getMockEvent = (data: Record<string, unknown>, lastInputPoint = { x: 100, y: 200 }): PaletteDropInputEvent => ({
  name: 'paletteDrop',
  id: 'test-id',
  timestamp: Date.now(),
  modifiers: {
    primary: false,
    secondary: false,
    shift: false,
    meta: false,
  },
  lastInputPoint,
  data,
});

describe('PaletteDropEventHandler', () => {
  let handler: PaletteDropEventHandler;
  let mockFlowCore: FlowCore;
  const mockCommandHandler = { emit: vi.fn() };
  const mockComputeNodeId = vi.fn();
  const mockClientToFlowPosition = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockComputeNodeId.mockReturnValue('generated-id-123');
    mockClientToFlowPosition.mockImplementation((point) => ({
      x: point.x - 50,
      y: point.y - 50,
    }));

    mockFlowCore = {
      commandHandler: mockCommandHandler,
      clientToFlowPosition: mockClientToFlowPosition,
      config: {
        computeNodeId: mockComputeNodeId,
      },
    } as unknown as FlowCore;

    handler = new PaletteDropEventHandler(mockFlowCore);
  });

  describe('handle', () => {
    it('should emit paletteDropNode command with basic node', () => {
      const nodeData = {
        type: 'default',
        data: { label: 'New Node' },
      };
      const event = getMockEvent(nodeData, { x: 100, y: 200 });

      handler.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledOnce();
      expect(mockCommandHandler.emit).toHaveBeenCalledWith('paletteDropNode', {
        node: {
          type: 'default',
          data: { label: 'New Node' },
          id: 'generated-id-123',
          position: { x: 50, y: 150 },
        },
      });
    });

    it('should generate new ID for dropped node', () => {
      const nodeData = {
        id: 'palette-template-id',
        type: 'custom',
        data: {},
      };
      const event = getMockEvent(nodeData);

      handler.handle(event);

      expect(mockComputeNodeId).toHaveBeenCalledOnce();
      expect(mockCommandHandler.emit).toHaveBeenCalledWith('paletteDropNode', {
        node: expect.objectContaining({
          id: 'generated-id-123',
        }),
      });
    });

    it('should convert client position to flow position', () => {
      const nodeData = { type: 'default', data: {} };
      const clientPoint = { x: 300, y: 400 };
      const event = getMockEvent(nodeData, clientPoint);

      handler.handle(event);

      expect(mockClientToFlowPosition).toHaveBeenCalledOnce();
      expect(mockClientToFlowPosition).toHaveBeenCalledWith(clientPoint);
      expect(mockCommandHandler.emit).toHaveBeenCalledWith('paletteDropNode', {
        node: expect.objectContaining({
          position: { x: 250, y: 350 },
        }),
      });
    });

    it('should preserve node type from palette data', () => {
      const nodeData = {
        type: 'custom-component',
        data: {},
      };
      const event = getMockEvent(nodeData);

      handler.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('paletteDropNode', {
        node: expect.objectContaining({
          type: 'custom-component',
        }),
      });
    });

    it('should preserve node data from palette', () => {
      const nodeData = {
        type: 'default',
        data: {
          label: 'Process Step',
          description: 'Important step',
          config: { timeout: 5000 },
        },
      };
      const event = getMockEvent(nodeData);

      handler.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('paletteDropNode', {
        node: expect.objectContaining({
          data: {
            label: 'Process Step',
            description: 'Important step',
            config: { timeout: 5000 },
          },
        }),
      });
    });

    it('should preserve custom node properties', () => {
      const nodeData = {
        type: 'resizable',
        data: { label: 'Custom' },
        size: { width: 200, height: 150 },
        resizable: true,
        rotatable: true,
        autoSize: false,
      };
      const event = getMockEvent(nodeData);

      handler.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('paletteDropNode', {
        node: expect.objectContaining({
          type: 'resizable',
          size: { width: 200, height: 150 },
          resizable: true,
          rotatable: true,
          autoSize: false,
        }),
      });
    });

    it('should handle node with ports', () => {
      const nodeData = {
        type: 'node-with-ports',
        data: {},
        ports: [
          { id: 'port1', type: 'input', side: 'left' },
          { id: 'port2', type: 'output', side: 'right' },
        ],
      };
      const event = getMockEvent(nodeData);

      handler.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('paletteDropNode', {
        node: expect.objectContaining({
          ports: [
            { id: 'port1', type: 'input', side: 'left' },
            { id: 'port2', type: 'output', side: 'right' },
          ],
        }),
      });
    });

    it('should handle different drop positions', () => {
      const nodeData = { type: 'default', data: {} };

      // Drop at origin
      mockClientToFlowPosition.mockReturnValueOnce({ x: 0, y: 0 });
      handler.handle(getMockEvent(nodeData, { x: 0, y: 0 }));
      expect(mockCommandHandler.emit).toHaveBeenLastCalledWith('paletteDropNode', {
        node: expect.objectContaining({
          position: { x: 0, y: 0 },
        }),
      });

      // Drop at negative coordinates
      mockClientToFlowPosition.mockReturnValueOnce({ x: -100, y: -50 });
      handler.handle(getMockEvent(nodeData, { x: -150, y: -100 }));
      expect(mockCommandHandler.emit).toHaveBeenLastCalledWith('paletteDropNode', {
        node: expect.objectContaining({
          position: { x: -100, y: -50 },
        }),
      });

      // Drop at large coordinates
      mockClientToFlowPosition.mockReturnValueOnce({ x: 5000, y: 3000 });
      handler.handle(getMockEvent(nodeData, { x: 5050, y: 3050 }));
      expect(mockCommandHandler.emit).toHaveBeenLastCalledWith('paletteDropNode', {
        node: expect.objectContaining({
          position: { x: 5000, y: 3000 },
        }),
      });
    });

    it('should handle decimal drop positions', () => {
      const nodeData = { type: 'default', data: {} };
      mockClientToFlowPosition.mockReturnValueOnce({ x: 123.456, y: 789.012 });

      handler.handle(getMockEvent(nodeData, { x: 173.456, y: 839.012 }));

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('paletteDropNode', {
        node: expect.objectContaining({
          position: { x: 123.456, y: 789.012 },
        }),
      });
    });

    it('should handle node with minimal properties', () => {
      const nodeData = {
        data: {},
      };
      const event = getMockEvent(nodeData);

      handler.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('paletteDropNode', {
        node: expect.objectContaining({
          id: 'generated-id-123',
          data: {},
        }),
      });
    });

    it('should handle node with group properties', () => {
      const nodeData = {
        type: 'group',
        data: { label: 'Group Container' },
        isGroup: true,
        zOrder: 1,
      };
      const event = getMockEvent(nodeData);

      handler.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('paletteDropNode', {
        node: expect.objectContaining({
          type: 'group',
          isGroup: true,
          zOrder: 1,
        }),
      });
    });

    it('should override template ID with generated ID', () => {
      const nodeData = {
        id: 'should-be-replaced',
        type: 'default',
        data: {},
      };
      mockComputeNodeId.mockReturnValue('new-unique-id');

      handler.handle(getMockEvent(nodeData));

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('paletteDropNode', {
        node: expect.objectContaining({
          id: 'new-unique-id',
        }),
      });
    });

    it('should handle node with angle property', () => {
      const nodeData = {
        type: 'rotated',
        data: {},
        angle: 45,
        rotatable: true,
      };
      const event = getMockEvent(nodeData);

      handler.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('paletteDropNode', {
        node: expect.objectContaining({
          angle: 45,
          rotatable: true,
        }),
      });
    });

    it('should handle complex node configuration', () => {
      const nodeData = {
        type: 'complex-node',
        data: {
          label: 'Complex',
          metadata: {
            created: '2024-01-01',
            author: 'test',
          },
          nested: {
            deep: {
              value: 42,
            },
          },
        },
        size: { width: 300, height: 200 },
        resizable: true,
        rotatable: true,
        autoSize: false,
        angle: 15,
        zOrder: 5,
        ports: [
          { id: 'in1', type: 'input', side: 'left' },
          { id: 'out1', type: 'output', side: 'right' },
        ],
      };
      const event = getMockEvent(nodeData, { x: 500, y: 600 });
      mockClientToFlowPosition.mockReturnValueOnce({ x: 450, y: 550 });
      mockComputeNodeId.mockReturnValue('complex-123');

      handler.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('paletteDropNode', {
        node: {
          type: 'complex-node',
          data: {
            label: 'Complex',
            metadata: {
              created: '2024-01-01',
              author: 'test',
            },
            nested: {
              deep: {
                value: 42,
              },
            },
          },
          size: { width: 300, height: 200 },
          resizable: true,
          rotatable: true,
          autoSize: false,
          angle: 15,
          zOrder: 5,
          ports: [
            { id: 'in1', type: 'input', side: 'left' },
            { id: 'out1', type: 'output', side: 'right' },
          ],
          id: 'complex-123',
          position: { x: 450, y: 550 },
        },
      });
    });

    it('should generate different IDs for multiple drops', () => {
      const nodeData = { type: 'default', data: {} };

      mockComputeNodeId.mockReturnValueOnce('id-1');
      handler.handle(getMockEvent(nodeData));

      mockComputeNodeId.mockReturnValueOnce('id-2');
      handler.handle(getMockEvent(nodeData));

      mockComputeNodeId.mockReturnValueOnce('id-3');
      handler.handle(getMockEvent(nodeData));

      expect(mockComputeNodeId).toHaveBeenCalledTimes(3);
      expect(mockCommandHandler.emit).toHaveBeenNthCalledWith(1, 'paletteDropNode', {
        node: expect.objectContaining({ id: 'id-1' }),
      });
      expect(mockCommandHandler.emit).toHaveBeenNthCalledWith(2, 'paletteDropNode', {
        node: expect.objectContaining({ id: 'id-2' }),
      });
      expect(mockCommandHandler.emit).toHaveBeenNthCalledWith(3, 'paletteDropNode', {
        node: expect.objectContaining({ id: 'id-3' }),
      });
    });

    it('should handle node with selected property', () => {
      const nodeData = {
        type: 'default',
        data: {},
        selected: true,
      };
      const event = getMockEvent(nodeData);

      handler.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('paletteDropNode', {
        node: expect.objectContaining({
          selected: true,
        }),
      });
    });

    it('should handle empty data object', () => {
      const nodeData = {
        type: 'minimal',
        data: {},
      };
      const event = getMockEvent(nodeData);

      handler.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('paletteDropNode', {
        node: expect.objectContaining({
          type: 'minimal',
          data: {},
        }),
      });
    });
  });
});
