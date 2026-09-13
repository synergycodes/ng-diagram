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
          virtualization: { enabled: false },
        },
      },
    } as unknown as CommandHandler;
  });

  describe('Basic functionality', () => {
    it('should fit all nodes in the viewport', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 0, y: 0, width: 100, height: 100 },
        },
        {
          id: '2',
          position: { x: 200, y: 200 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 200, y: 200, width: 100, height: 100 },
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
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 100, y: 100 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 100, y: 100, width: 100, height: 100 },
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

      expect(mockApplyUpdate).toHaveBeenCalled();
    });

    it('should apply custom padding', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 0, y: 0, width: 100, height: 100 },
        },
        {
          id: '2',
          position: { x: 200, y: 200 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 200, y: 200, width: 100, height: 100 },
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

      await zoomToFit(commandHandler, { name: 'zoomToFit', padding: 100 });

      expect(mockApplyUpdate).toHaveBeenCalled();
      const updateCall = mockApplyUpdate.mock.calls[0][0];
      const calculatedScale = updateCall.metadataUpdate.viewport.scale;

      expect(calculatedScale).toBeLessThanOrEqual(2);
    });
  });

  describe('CSS-like padding', () => {
    it('should handle single value padding (all sides)', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 0, y: 0, width: 100, height: 100 },
        },
        {
          id: '2',
          position: { x: 200, y: 200 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 200, y: 200, width: 100, height: 100 },
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

      await zoomToFit(commandHandler, { name: 'zoomToFit', padding: 50 });

      expect(mockApplyUpdate).toHaveBeenCalled();
    });

    it('should handle two values [v, h] (vertical, horizontal)', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 0, y: 0, width: 100, height: 100 },
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

      await zoomToFit(commandHandler, { name: 'zoomToFit', padding: [20, 40] });

      expect(mockApplyUpdate).toHaveBeenCalled();
    });

    it('should handle three values [t, h, b] (top, horizontal, bottom)', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 0, y: 0, width: 100, height: 100 },
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

      await zoomToFit(commandHandler, { name: 'zoomToFit', padding: [10, 30, 20] });

      expect(mockApplyUpdate).toHaveBeenCalled();
    });

    it('should handle four values [t, r, b, l] (top, right, bottom, left)', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 0, y: 0, width: 100, height: 100 },
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

      await zoomToFit(commandHandler, { name: 'zoomToFit', padding: [10, 20, 30, 40] });

      expect(mockApplyUpdate).toHaveBeenCalled();
    });

    it('should apply asymmetric padding correctly', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 100, y: 100 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 100, y: 100, width: 100, height: 100 },
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

      // Large left padding, small right padding should shift content to the right
      await zoomToFit(commandHandler, { name: 'zoomToFit', padding: [50, 10, 50, 100] });

      expect(mockApplyUpdate).toHaveBeenCalled();
      const updateCall = mockApplyUpdate.mock.calls[0][0];
      const viewport = updateCall.metadataUpdate.viewport;

      expect(viewport.x).toBeDefined();
    });
  });

  describe('Filtering by IDs', () => {
    it('should fit only specified nodeIds', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 0, y: 0, width: 100, height: 100 },
        },
        {
          id: '2',
          position: { x: 200, y: 200 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 200, y: 200, width: 100, height: 100 },
        },
        {
          id: '3',
          position: { x: 1000, y: 1000 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 1000, y: 1000, width: 100, height: 100 },
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

      await zoomToFit(commandHandler, { name: 'zoomToFit', nodeIds: ['1', '2'] });

      expect(mockApplyUpdate).toHaveBeenCalled();
    });

    it('should handle invalid nodeIds gracefully', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 0, y: 0, width: 100, height: 100 },
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

      await zoomToFit(commandHandler, { name: 'zoomToFit', nodeIds: ['999', 'invalid'] });

      expect(mockApplyUpdate).not.toHaveBeenCalled();
    });

    it('should scope the fit to the target nodes in a diagram with edges', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 0, y: 0, width: 100, height: 100 },
        },
        {
          id: '2',
          position: { x: 200, y: 200 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 200, y: 200, width: 100, height: 100 },
        },
        {
          id: '3',
          position: { x: 5000, y: 5000 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 5000, y: 5000, width: 100, height: 100 },
        },
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
        {
          id: 'e2',
          source: '2',
          target: '3',
          data: {},
          points: [
            { x: 250, y: 250 },
            { x: 5050, y: 5050 },
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

      await zoomToFit(commandHandler, { name: 'zoomToFit', nodeIds: ['1', '2'] });

      expect(mockApplyUpdate).toHaveBeenCalled();
      const { viewport } = mockApplyUpdate.mock.calls[0][0].metadataUpdate;

      // Only nodes 1 and 2 plus the edge between them count: bounds {0, 0, 300, 300}.
      // Edge e2 leads outside the target set and must not stretch the fit to node 3.
      // With padding 20, available space is 760x560 → scale limited by height.
      expect(viewport.scale).toBeCloseTo(560 / 300, 5);
      // Viewport centers on the subset center (150, 150).
      expect(viewport.x).toBeCloseTo(400 - 150 * viewport.scale, 5);
      expect(viewport.y).toBeCloseTo(300 - 150 * viewport.scale, 5);
    });

    it('should keep explicit edgeIds meaning even when nodeIds are also given', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 0, y: 0, width: 100, height: 100 },
        },
        {
          id: '2',
          position: { x: 400, y: 400 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 400, y: 400, width: 100, height: 100 },
        },
      ];

      const edges: Edge[] = [
        {
          id: 'e1',
          source: '1',
          target: '2',
          data: {},
          points: [
            { x: 100, y: 100 },
            { x: 400, y: 400 },
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

      // Edge e1 connects to node 2 which is outside the node target set — explicit edgeIds still include it.
      await zoomToFit(commandHandler, { name: 'zoomToFit', nodeIds: ['1'], edgeIds: ['e1'] });

      expect(mockApplyUpdate).toHaveBeenCalled();
      const { viewport } = mockApplyUpdate.mock.calls[0][0].metadataUpdate;

      // Bounds are node 1 united with e1 points: {0, 0, 400, 400}.
      // With padding 20, available space is 760x560 → scale limited by height.
      expect(viewport.scale).toBeCloseTo(560 / 400, 5);
      expect(viewport.x).toBeCloseTo(400 - 200 * viewport.scale, 5);
      expect(viewport.y).toBeCloseTo(300 - 200 * viewport.scale, 5);
    });

    it('should frame only the selected nodes away from the origin when no edges are targeted', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 680, y: 220 },
          size: { width: 240, height: 300 },
          data: {},
          measuredBounds: { x: 680, y: 220, width: 240, height: 300 },
        },
        {
          id: '2',
          position: { x: 1040, y: 260 },
          size: { width: 240, height: 240 },
          data: {},
          measuredBounds: { x: 1040, y: 260, width: 240, height: 240 },
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

      await zoomToFit(commandHandler, { name: 'zoomToFit', nodeIds: ['1', '2'] });

      expect(mockApplyUpdate).toHaveBeenCalled();
      const { viewport } = mockApplyUpdate.mock.calls[0][0].metadataUpdate;

      // Bounds must be {680, 220, 600, 300} — not dragged back to the origin.
      // With padding 20, available space is 760x560 → scale limited by width.
      expect(viewport.scale).toBeCloseTo(760 / 600, 5);
      // Viewport centers on the subset center (980, 370).
      expect(viewport.x).toBeCloseTo(400 - 980 * viewport.scale, 5);
      expect(viewport.y).toBeCloseTo(300 - 370 * viewport.scale, 5);
    });
  });

  describe('Hidden elements', () => {
    it('should ignore nodes with computedHidden when calculating bounds', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 680, y: 220 },
          size: { width: 240, height: 300 },
          data: {},
          measuredBounds: { x: 680, y: 220, width: 240, height: 300 },
        },
        {
          id: '2',
          position: { x: 5000, y: 5000 },
          size: { width: 240, height: 240 },
          data: {},
          measuredBounds: { x: 5000, y: 5000, width: 240, height: 240 },
          computedHidden: true,
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

      expect(mockApplyUpdate).toHaveBeenCalled();
      const { viewport } = mockApplyUpdate.mock.calls[0][0].metadataUpdate;

      // Bounds must cover only the visible node {680, 220, 240, 300}.
      // With padding 20, available space is 760x560 → scale limited by height.
      expect(viewport.scale).toBeCloseTo(560 / 300, 5);
      // Viewport centers on the visible node center (800, 370).
      expect(viewport.x).toBeCloseTo(400 - 800 * viewport.scale, 5);
      expect(viewport.y).toBeCloseTo(300 - 370 * viewport.scale, 5);
    });

    it('should be a no-op when all target nodes are hidden, even in a diagram with visible edges', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 0, y: 0, width: 100, height: 100 },
        },
        {
          id: '2',
          position: { x: 400, y: 400 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 400, y: 400, width: 100, height: 100 },
        },
        {
          id: '3',
          position: { x: 5000, y: 5000 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 5000, y: 5000, width: 100, height: 100 },
          computedHidden: true,
        },
      ];

      const edges: Edge[] = [
        {
          id: 'e1',
          source: '1',
          target: '2',
          data: {},
          points: [
            { x: 100, y: 100 },
            { x: 400, y: 400 },
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

      await zoomToFit(commandHandler, { name: 'zoomToFit', nodeIds: ['3'] });

      expect(mockApplyUpdate).not.toHaveBeenCalled();
    });

    it('should frame only the visible targets when nodeIds mix visible and hidden nodes', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 680, y: 220 },
          size: { width: 240, height: 300 },
          data: {},
          measuredBounds: { x: 680, y: 220, width: 240, height: 300 },
        },
        {
          id: '2',
          position: { x: 5000, y: 5000 },
          size: { width: 240, height: 240 },
          data: {},
          measuredBounds: { x: 5000, y: 5000, width: 240, height: 240 },
          computedHidden: true,
        },
        {
          id: '3',
          position: { x: 10000, y: 10000 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 10000, y: 10000, width: 100, height: 100 },
        },
      ];

      const edges: Edge[] = [
        {
          id: 'e1',
          source: '1',
          target: '2',
          data: {},
          points: [
            { x: 920, y: 370 },
            { x: 5000, y: 5120 },
          ],
          computedHidden: true,
        },
        {
          id: 'e2',
          source: '1',
          target: '3',
          data: {},
          points: [
            { x: 920, y: 370 },
            { x: 10000, y: 10050 },
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

      await zoomToFit(commandHandler, { name: 'zoomToFit', nodeIds: ['1', '2'] });

      expect(mockApplyUpdate).toHaveBeenCalled();
      const { viewport } = mockApplyUpdate.mock.calls[0][0].metadataUpdate;

      // Bounds must cover only the visible target node {680, 220, 240, 300}:
      // node 2 is hidden, edge e1 is hidden, and edge e2 leads outside the target set.
      // With padding 20, available space is 760x560 → scale limited by height.
      expect(viewport.scale).toBeCloseTo(560 / 300, 5);
      // Viewport centers on the visible node center (800, 370).
      expect(viewport.x).toBeCloseTo(400 - 800 * viewport.scale, 5);
      expect(viewport.y).toBeCloseTo(300 - 370 * viewport.scale, 5);
    });

    it('should not update when all elements have computedHidden', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 0, y: 0, width: 100, height: 100 },
          computedHidden: true,
        },
      ];

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
          computedHidden: true,
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

    it('should handle edge missing points gracefully', async () => {
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
    });

    it('should fit nodes and edges together', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 0, y: 0, width: 100, height: 100 },
        },
        {
          id: '2',
          position: { x: 200, y: 200 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 200, y: 200, width: 100, height: 100 },
        },
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
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 0, y: 0 },
          size: { width: 10000, height: 10000 },
          data: {},
          measuredBounds: { x: 0, y: 0, width: 10000, height: 10000 },
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

      expect(mockApplyUpdate).toHaveBeenCalled();
      const updateCall = mockApplyUpdate.mock.calls[0][0];
      const calculatedScale = updateCall.metadataUpdate.viewport.scale;

      expect(calculatedScale).toBeGreaterThanOrEqual(0.1);
    });

    it('should clamp scale to maximum zoom', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 0, y: 0 },
          size: { width: 10, height: 10 },
          data: {},
          measuredBounds: { x: 0, y: 0, width: 10, height: 10 },
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

      expect(mockApplyUpdate).toHaveBeenCalled();
      const updateCall = mockApplyUpdate.mock.calls[0][0];
      const calculatedScale = updateCall.metadataUpdate.viewport.scale;

      expect(calculatedScale).toBeLessThanOrEqual(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty diagram gracefully', async () => {
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

    it('should handle node missing measuredBounds gracefully', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 0, y: 0 },
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
    });

    it('should not update if viewport dimensions are missing', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 0, y: 0, width: 100, height: 100 },
        },
      ];

      const state: FlowState = {
        nodes,
        edges: [],
        metadata: {
          viewport: { x: 0, y: 0, scale: 1 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit' });

      expect(mockApplyUpdate).not.toHaveBeenCalled();
    });

    it('should not update if padding is too large', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 0, y: 0, width: 100, height: 100 },
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

      await zoomToFit(commandHandler, { name: 'zoomToFit', padding: 500 });

      expect(mockApplyUpdate).not.toHaveBeenCalled();
    });

    it('should handle zero padding for edge-to-edge fitting', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 0, y: 0, width: 100, height: 100 },
        },
        {
          id: '2',
          position: { x: 200, y: 200 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 200, y: 200, width: 100, height: 100 },
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

      await zoomToFit(commandHandler, { name: 'zoomToFit', padding: 0 });

      expect(mockApplyUpdate).toHaveBeenCalled();
    });

    it('should not update if viewport is already at target position and scale', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 100, y: 100 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: 100, y: 100, width: 100, height: 100 },
        },
      ];

      const state: FlowState = {
        nodes,
        edges: [],
        metadata: {
          viewport: { x: 275, y: 200, scale: 2, width: 800, height: 600 },
        },
      };

      (commandHandler.flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue(state);

      await zoomToFit(commandHandler, { name: 'zoomToFit' });
    });
  });
});
