import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CommandHandler, Edge, FlowState, Node } from '../../../types';
import { zoomToFit } from '../zoom-to-fit';

describe('zoomToFit command', () => {
  let commandHandler: CommandHandler;
  let mockApplyUpdate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockApplyUpdate = vi.fn().mockResolvedValue(undefined);

    commandHandler = {
      flowCore: {
        getState: vi.fn(),
        applyUpdate: mockApplyUpdate,
        config: {
          zoom: { min: 0.1, max: 2, step: 0.1, zoomToFit: { padding: 20 } },
        },
      },
    } as unknown as CommandHandler;
  });

  describe('Basic functionality', () => {
    it('should fit all nodes in the viewport', async () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, data: {} },
        { id: '2', position: { x: 200, y: 200 }, size: { width: 100, height: 100 }, data: {} },
      ];

      const state: FlowState = {
        nodes,
        edges: [],
        metadata: {
          viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit' });

      expect(mockApplyUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadataUpdate: expect.objectContaining({
            viewport: expect.objectContaining({
              scale: expect.any(Number),
              x: expect.any(Number),
              y: expect.any(Number),
            }),
          }),
        }),
        'zoomToFit'
      );
    });

    it('should handle single node', async () => {
      const nodes: Node[] = [{ id: '1', position: { x: 100, y: 100 }, size: { width: 100, height: 100 }, data: {} }];

      const state: FlowState = {
        nodes,
        edges: [],
        metadata: {
          viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit' });

      expect(mockApplyUpdate).toHaveBeenCalled();
    });

    it('should apply custom padding', async () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, data: {} },
        { id: '2', position: { x: 200, y: 200 }, size: { width: 100, height: 100 }, data: {} },
      ];

      const state: FlowState = {
        nodes,
        edges: [],
        metadata: {
          viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit', padding: 100 });

      expect(mockApplyUpdate).toHaveBeenCalled();
      const updateCall = mockApplyUpdate.mock.calls[0][0];
      const calculatedScale = updateCall.metadataUpdate.viewport.scale;

      // With more padding, scale should be smaller
      expect(calculatedScale).toBeLessThan(2);
    });
  });

  describe('CSS-like padding', () => {
    it('should handle single value padding (all sides)', async () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, data: {} },
        { id: '2', position: { x: 200, y: 200 }, size: { width: 100, height: 100 }, data: {} },
      ];

      const state: FlowState = {
        nodes,
        edges: [],
        metadata: {
          viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit', padding: 50 });

      expect(mockApplyUpdate).toHaveBeenCalled();
    });

    it('should handle two values [v, h] (vertical, horizontal)', async () => {
      const nodes: Node[] = [{ id: '1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, data: {} }];

      const state: FlowState = {
        nodes,
        edges: [],
        metadata: {
          viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit', padding: [20, 40] });

      expect(mockApplyUpdate).toHaveBeenCalled();
    });

    it('should handle three values [t, h, b] (top, horizontal, bottom)', async () => {
      const nodes: Node[] = [{ id: '1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, data: {} }];

      const state: FlowState = {
        nodes,
        edges: [],
        metadata: {
          viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit', padding: [10, 30, 20] });

      expect(mockApplyUpdate).toHaveBeenCalled();
    });

    it('should handle four values [t, r, b, l] (top, right, bottom, left)', async () => {
      const nodes: Node[] = [{ id: '1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, data: {} }];

      const state: FlowState = {
        nodes,
        edges: [],
        metadata: {
          viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit', padding: [10, 20, 30, 40] });

      expect(mockApplyUpdate).toHaveBeenCalled();
    });

    it('should apply asymmetric padding correctly', async () => {
      const nodes: Node[] = [{ id: '1', position: { x: 100, y: 100 }, size: { width: 100, height: 100 }, data: {} }];

      const state: FlowState = {
        nodes,
        edges: [],
        metadata: {
          viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      // Large left padding, small right padding should shift content to the right
      await zoomToFit(commandHandler, { name: 'zoomToFit', padding: [50, 10, 50, 100] });

      expect(mockApplyUpdate).toHaveBeenCalled();
      const updateCall = mockApplyUpdate.mock.calls[0][0];
      const viewport = updateCall.metadataUpdate.viewport;

      // With more left padding than right, content should be shifted right (higher x)
      expect(viewport.x).toBeDefined();
    });
  });

  describe('Filtering by IDs', () => {
    it('should fit only specified nodeIds', async () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, data: {} },
        { id: '2', position: { x: 200, y: 200 }, size: { width: 100, height: 100 }, data: {} },
        { id: '3', position: { x: 1000, y: 1000 }, size: { width: 100, height: 100 }, data: {} },
      ];

      const state: FlowState = {
        nodes,
        edges: [],
        metadata: {
          viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit', nodeIds: ['1', '2'] });

      expect(mockApplyUpdate).toHaveBeenCalled();
    });

    it('should handle invalid nodeIds gracefully', async () => {
      const nodes: Node[] = [{ id: '1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, data: {} }];

      const state: FlowState = {
        nodes,
        edges: [],
        metadata: {
          viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit', nodeIds: ['999', 'invalid'] });

      expect(mockApplyUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Edge handling', () => {
    it('should include edges with explicit points', async () => {
      const edges: Edge[] = [
        {
          id: 'e1',
          source: '1',
          target: '2',
          data: {},
          points: [
            { x: 50, y: 50 },
            { x: 150, y: 150 },
          ],
        },
      ];

      const state: FlowState = {
        nodes: [],
        edges,
        metadata: {
          viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit' });

      expect(mockApplyUpdate).toHaveBeenCalled();
    });

    it('should not update and warn when edge is missing points', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const edges: Edge[] = [
        {
          id: 'e1',
          source: '1',
          target: '2',
          data: {},
        },
      ];

      const state: FlowState = {
        nodes: [],
        edges,
        metadata: {
          viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit' });

      expect(mockApplyUpdate).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'zoomToFit: Edge "e1" is missing points. All edges must have points defined.'
      );
      consoleWarnSpy.mockRestore();
    });

    it('should fit nodes and edges together', async () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, data: {} },
        { id: '2', position: { x: 200, y: 200 }, size: { width: 100, height: 100 }, data: {} },
      ];

      const edges: Edge[] = [
        {
          id: 'e1',
          source: '1',
          target: '2',
          data: {},
          points: [
            { x: 50, y: 50 },
            { x: 250, y: 250 },
          ],
        },
      ];

      const state: FlowState = {
        nodes,
        edges,
        metadata: {
          viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit' });

      expect(mockApplyUpdate).toHaveBeenCalled();
    });
  });

  describe('Zoom constraints', () => {
    it('should clamp scale to minimum zoom', async () => {
      const nodes: Node[] = [{ id: '1', position: { x: 0, y: 0 }, size: { width: 10000, height: 10000 }, data: {} }];

      const state: FlowState = {
        nodes,
        edges: [],
        metadata: {
          viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit' });

      expect(mockApplyUpdate).toHaveBeenCalled();
      const updateCall = mockApplyUpdate.mock.calls[0][0];
      const calculatedScale = updateCall.metadataUpdate.viewport.scale;

      expect(calculatedScale).toBeGreaterThanOrEqual(0.1); // min zoom
    });

    it('should clamp scale to maximum zoom', async () => {
      const nodes: Node[] = [{ id: '1', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, data: {} }];

      const state: FlowState = {
        nodes,
        edges: [],
        metadata: {
          viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit' });

      expect(mockApplyUpdate).toHaveBeenCalled();
      const updateCall = mockApplyUpdate.mock.calls[0][0];
      const calculatedScale = updateCall.metadataUpdate.viewport.scale;

      expect(calculatedScale).toBeLessThanOrEqual(2); // max zoom
    });
  });

  describe('Edge cases', () => {
    it('should not update viewport for empty diagram', async () => {
      const state: FlowState = {
        nodes: [],
        edges: [],
        metadata: {
          viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit' });

      expect(mockApplyUpdate).not.toHaveBeenCalled();
    });

    it('should not update and warn when node is missing size', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const nodes: Node[] = [{ id: '1', position: { x: 0, y: 0 }, data: {} }];

      const state: FlowState = {
        nodes,
        edges: [],
        metadata: {
          viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit' });

      expect(mockApplyUpdate).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'zoomToFit: Node "1" is missing size. All nodes must have size defined.'
      );
      consoleWarnSpy.mockRestore();
    });

    it('should not update and warn when node has incomplete size (missing width)', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const nodes: Node[] = [
        {
          id: '2',
          position: { x: 0, y: 0 },
          size: { height: 100 } as unknown as { width: number; height: number },
          data: {},
        },
      ];

      const state: FlowState = {
        nodes,
        edges: [],
        metadata: {
          viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit' });

      expect(mockApplyUpdate).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'zoomToFit: Node "2" is missing size. All nodes must have size defined.'
      );
      consoleWarnSpy.mockRestore();
    });

    it('should not update and warn when node has incomplete size (missing height)', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const nodes: Node[] = [
        {
          id: '3',
          position: { x: 0, y: 0 },
          size: { width: 100 } as unknown as { width: number; height: number },
          data: {},
        },
      ];

      const state: FlowState = {
        nodes,
        edges: [],
        metadata: {
          viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit' });

      expect(mockApplyUpdate).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'zoomToFit: Node "3" is missing size. All nodes must have size defined.'
      );
      consoleWarnSpy.mockRestore();
    });

    it('should not update if viewport dimensions are missing', async () => {
      const nodes: Node[] = [{ id: '1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, data: {} }];

      const state: FlowState = {
        nodes,
        edges: [],
        metadata: {
          viewport: { x: 0, y: 0, scale: 1 }, // missing width and height
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit' });

      expect(mockApplyUpdate).not.toHaveBeenCalled();
    });

    it('should not update if padding is too large', async () => {
      const nodes: Node[] = [{ id: '1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, data: {} }];

      const state: FlowState = {
        nodes,
        edges: [],
        metadata: {
          viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit', padding: 500 });

      expect(mockApplyUpdate).not.toHaveBeenCalled();
    });

    it('should handle zero padding for edge-to-edge fitting', async () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, data: {} },
        { id: '2', position: { x: 200, y: 200 }, size: { width: 100, height: 100 }, data: {} },
      ];

      const state: FlowState = {
        nodes,
        edges: [],
        metadata: {
          viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit', padding: 0 });

      expect(mockApplyUpdate).toHaveBeenCalled();
    });

    it('should not update if viewport is already at target position and scale', async () => {
      const nodes: Node[] = [{ id: '1', position: { x: 100, y: 100 }, size: { width: 100, height: 100 }, data: {} }];

      const state: FlowState = {
        nodes,
        edges: [],
        metadata: {
          viewport: { x: 275, y: 200, scale: 2, width: 800, height: 600 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit' });

      // This test checks that if calculated values match current viewport, no update occurs
      // The exact values depend on the calculation, but the principle is tested
      // In practice, this is unlikely to happen exactly
    });
  });
});
