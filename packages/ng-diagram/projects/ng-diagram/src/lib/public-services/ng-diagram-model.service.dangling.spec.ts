import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Edge, Node } from '../../core/src';
import { FlowCoreProviderService } from '../services/flow-core-provider/flow-core-provider.service';
import { NgDiagramModelService } from './ng-diagram-model.service';
import { NgDiagramService } from './ng-diagram.service';

describe('NgDiagramModelService dangling edges (attachEdge / detachEdge)', () => {
  let service: NgDiagramModelService;
  let mockEmit: ReturnType<typeof vi.fn>;
  let getEdgeById: ReturnType<typeof vi.fn>;
  let getNodeById: ReturnType<typeof vi.fn>;
  let validateConnection: ReturnType<typeof vi.fn>;
  let danglingEdgesConfig: { enabled: boolean };

  const sourceNode: Node = {
    id: 'node-s',
    position: { x: 0, y: 0 },
    data: {},
    measuredPorts: [
      {
        id: 'out',
        type: 'source',
        side: 'right',
        position: { x: 90, y: 45 },
        size: { width: 10, height: 10 },
        nodeId: 'node-s',
      },
    ],
  };

  // Port 'in': node position (200, 100) + port position (0, 20), side left
  // → flow position (200, 125) with the 10x10 port size.
  const targetNode: Node = {
    id: 'node-t',
    position: { x: 200, y: 100 },
    data: {},
    measuredPorts: [
      {
        id: 'in',
        type: 'target',
        side: 'left',
        position: { x: 0, y: 20 },
        size: { width: 10, height: 10 },
        nodeId: 'node-t',
      },
    ],
  };

  const danglingEdge: Edge = {
    id: 'edge-1',
    source: 'node-s',
    sourcePort: 'out',
    target: '',
    targetPort: undefined,
    targetPosition: { x: 400, y: 500 },
    data: {},
  };

  const nodes: Record<string, Node> = { 'node-s': sourceNode, 'node-t': targetNode };

  beforeEach(() => {
    mockEmit = vi.fn().mockResolvedValue(undefined);
    getEdgeById = vi.fn().mockReturnValue(danglingEdge);
    getNodeById = vi.fn((id: string) => nodes[id] ?? null);
    validateConnection = vi.fn().mockReturnValue(true);
    danglingEdgesConfig = { enabled: true };

    const mockFlowCore = {
      commandHandler: { emit: mockEmit },
      transactionManager: { isActive: vi.fn().mockReturnValue(false) },
      getEdgeById,
      getNodeById,
      get config() {
        return {
          danglingEdges: danglingEdgesConfig,
          linking: { validateConnection },
        };
      },
    };

    TestBed.configureTestingModule({
      providers: [
        NgDiagramModelService,
        { provide: NgDiagramService, useValue: { isInitialized: () => false } },
        {
          provide: FlowCoreProviderService,
          useValue: { provide: () => mockFlowCore, isInitialized: () => false },
        },
      ],
    });

    service = TestBed.inject(NgDiagramModelService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('attachEdge', () => {
    it('should return false without updating when the port does not exist on the node', async () => {
      const result = await service.attachEdge('edge-1', 'target', 'node-t', 'bogus-port');

      expect(result).toBe(false);
      expect(mockEmit).not.toHaveBeenCalled();
      expect(validateConnection).not.toHaveBeenCalled();
    });

    it('should return false without updating when the node is effectively hidden', async () => {
      getNodeById.mockImplementation((id: string) =>
        id === 'node-t' ? { ...targetNode, computedHidden: true } : (nodes[id] ?? null)
      );

      const result = await service.attachEdge('edge-1', 'target', 'node-t', 'in');

      expect(result).toBe(false);
      expect(mockEmit).not.toHaveBeenCalled();
    });

    it('should return false when validateConnection rejects, passing the attach context', async () => {
      validateConnection.mockReturnValue(false);

      const result = await service.attachEdge('edge-1', 'target', 'node-t', 'in');

      expect(result).toBe(false);
      expect(validateConnection).toHaveBeenCalledWith(
        sourceNode,
        sourceNode.measuredPorts![0],
        targetNode,
        targetNode.measuredPorts![0],
        {
          reason: 'attach',
          edge: danglingEdge,
          end: 'target',
        }
      );
      expect(mockEmit).not.toHaveBeenCalled();
    });

    it('should attach a valid port and update the edge', async () => {
      const result = await service.attachEdge('edge-1', 'target', 'node-t', 'in');

      expect(result).toBe(true);
      expect(mockEmit).toHaveBeenCalledWith('updateEdge', {
        id: 'edge-1',
        edgeChanges: { target: 'node-t', targetPort: 'in', targetPosition: undefined },
      });
    });

    it('should align the manual points of an attached manual-routing edge to the port anchor', async () => {
      const manualEdge: Edge = {
        ...danglingEdge,
        routingMode: 'manual',
        points: [
          { x: 10, y: 20 },
          { x: 400, y: 500 },
        ],
      };
      getEdgeById.mockReturnValue(manualEdge);

      const result = await service.attachEdge('edge-1', 'target', 'node-t', 'in');

      expect(result).toBe(true);
      expect(mockEmit).toHaveBeenCalledWith('updateEdge', {
        id: 'edge-1',
        edgeChanges: {
          target: 'node-t',
          targetPort: 'in',
          targetPosition: undefined,
          points: [
            { x: 10, y: 20 },
            { x: 200, y: 125 },
          ],
        },
      });
    });

    it('should return false when the edge does not exist', async () => {
      getEdgeById.mockReturnValue(null);

      const result = await service.attachEdge('missing', 'target', 'node-t', 'in');

      expect(result).toBe(false);
      expect(mockEmit).not.toHaveBeenCalled();
    });
  });

  describe('detachEdge', () => {
    const connectedEdge: Edge = {
      id: 'edge-2',
      source: 'node-s',
      target: 'node-t',
      targetPort: 'in',
      data: {},
    };

    it('should warn and no-op when dangling edges are disabled', async () => {
      danglingEdgesConfig.enabled = false;
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      getEdgeById.mockReturnValue(connectedEdge);

      await service.detachEdge('edge-2', 'target');

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('detachEdge ignored'));
      expect(mockEmit).not.toHaveBeenCalled();
    });

    it('should anchor the freed endpoint at the port position when the edge was connected to a port', async () => {
      getEdgeById.mockReturnValue(connectedEdge);

      await service.detachEdge('edge-2', 'target');

      expect(mockEmit).toHaveBeenCalledWith('updateEdge', {
        id: 'edge-2',
        edgeChanges: { target: '', targetPort: undefined, targetPosition: { x: 200, y: 125 } },
      });
    });

    it('should fall back to the routed endpoint when there is no port', async () => {
      getEdgeById.mockReturnValue({
        ...connectedEdge,
        targetPort: undefined,
        points: [
          { x: 1, y: 2 },
          { x: 300, y: 400 },
        ],
      });

      await service.detachEdge('edge-2', 'target');

      expect(mockEmit).toHaveBeenCalledWith('updateEdge', {
        id: 'edge-2',
        edgeChanges: { target: '', targetPort: undefined, targetPosition: { x: 300, y: 400 } },
      });
    });

    it('should fall back to the node center when there is no port and no routed points', async () => {
      getEdgeById.mockReturnValue({ ...connectedEdge, targetPort: undefined, points: undefined });
      getNodeById.mockImplementation((id: string) =>
        id === 'node-t' ? { ...targetNode, size: { width: 80, height: 40 } } : (nodes[id] ?? null)
      );

      await service.detachEdge('edge-2', 'target');

      expect(mockEmit).toHaveBeenCalledWith('updateEdge', {
        id: 'edge-2',
        edgeChanges: { target: '', targetPort: undefined, targetPosition: { x: 240, y: 120 } },
      });
    });

    it('should use the explicit position and align manual points', async () => {
      getEdgeById.mockReturnValue({
        ...connectedEdge,
        routingMode: 'manual',
        points: [
          { x: 1, y: 2 },
          { x: 300, y: 400 },
        ],
      });

      await service.detachEdge('edge-2', 'target', { x: 600, y: 700 });

      expect(mockEmit).toHaveBeenCalledWith('updateEdge', {
        id: 'edge-2',
        edgeChanges: {
          target: '',
          targetPort: undefined,
          targetPosition: { x: 600, y: 700 },
          points: [
            { x: 1, y: 2 },
            { x: 600, y: 700 },
          ],
        },
      });
    });

    it('should apply the manual points patch when moving an already-free endpoint', async () => {
      // The end is already dangling — only the anchor moves, and the stored
      // manual path must follow it in this branch too.
      getEdgeById.mockReturnValue({
        ...danglingEdge,
        routingMode: 'manual',
        points: [
          { x: 10, y: 20 },
          { x: 400, y: 500 },
        ],
      });

      await service.detachEdge('edge-1', 'target', { x: 42, y: 43 });

      expect(mockEmit).toHaveBeenCalledWith('updateEdge', {
        id: 'edge-1',
        edgeChanges: {
          targetPosition: { x: 42, y: 43 },
          points: [
            { x: 10, y: 20 },
            { x: 42, y: 43 },
          ],
        },
      });
    });

    it('should no-op on an already-free endpoint when no position is given', async () => {
      await service.detachEdge('edge-1', 'target');

      expect(mockEmit).not.toHaveBeenCalled();
    });
  });
});
