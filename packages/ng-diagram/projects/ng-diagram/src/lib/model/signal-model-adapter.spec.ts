import { TestBed } from '@angular/core/testing';
import type { Edge, Node, Viewport } from '../../core/src';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignalModelAdapter } from './signal-model-adapter';

describe('SignalModelAdapter', () => {
  let service: SignalModelAdapter;

  const mockNodes: Node[] = [
    { id: '1', type: 'default', data: {}, position: { x: 0, y: 0 } },
    { id: '2', type: 'default', data: {}, position: { x: 0, y: 0 } },
  ];

  const mockEdges: Edge[] = [{ id: 'e1-2', source: '1', target: '2', type: 'default', data: {} }];
  const viewport: Viewport = { x: 0, y: 0, scale: 1 };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SignalModelAdapter],
    });
    service = TestBed.inject(SignalModelAdapter);
  });

  it('should initialize with empty state', () => {
    expect(service.getNodes()).toEqual([]);
    expect(service.getEdges()).toEqual([]);
    expect(service.getMetadata()).toEqual({ viewport });
  });

  it('should set and get nodes', () => {
    service.updateNodes(mockNodes);
    expect(service.getNodes()).toEqual(mockNodes);
  });

  it('should set and get edges', () => {
    service.updateEdges(mockEdges);
    expect(service.getEdges()).toEqual(mockEdges);
  });

  it('should call onChange callback when state changes', async () => {
    const callback = vi.fn();
    service.onChange(callback);

    // Triggers reactivity
    service.updateNodes(mockNodes);

    await new Promise((resolve) => setTimeout(resolve));

    // Should have triggered the callback at least once
    expect(callback).toHaveBeenCalled();
  });

  it('should support functional updates to nodes', () => {
    service.updateNodes(mockNodes);
    service.updateNodes((prev) => [...prev, { id: '3', type: 'default', data: {}, position: { x: 0, y: 0 } }]);

    const updatedNodes = service.getNodes();
    expect(updatedNodes.length).toBe(3);
    expect(updatedNodes[2].id).toBe('3');
  });

  it('should support functional updates to edges', () => {
    service.updateEdges(mockEdges);
    service.updateEdges((prev) => [...prev, { id: 'e1-3', source: '1', target: '3', type: 'default', data: {} }]);

    const updatedEdges = service.getEdges();
    expect(updatedEdges.length).toBe(2);
    expect(updatedEdges[1].id).toBe('e1-3');
  });

  it('should handle empty arrays when setting nodes and edges', () => {
    service.updateNodes(mockNodes);
    service.updateEdges(mockEdges);

    service.updateNodes([]);
    service.updateEdges([]);

    expect(service.getNodes()).toEqual([]);
    expect(service.getEdges()).toEqual([]);
  });
});
