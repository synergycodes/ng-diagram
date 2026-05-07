import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { BatchResizeObserverService, type ObservedElementMetadata } from './batched-resize-observer.service';

describe('BatchResizeObserverService', () => {
  let service: BatchResizeObserverService;
  let mockResizeObserver: {
    observe: ReturnType<typeof vi.fn>;
    unobserve: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  };
  let mockRequestAnimationFrame: ReturnType<typeof vi.fn>;
  let mockCancelAnimationFrame: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockResizeObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };

    global.ResizeObserver = vi.fn().mockImplementation(() => mockResizeObserver);

    mockRequestAnimationFrame = vi.fn().mockReturnValue(123);
    mockCancelAnimationFrame = vi.fn();
    global.requestAnimationFrame = mockRequestAnimationFrame;
    global.cancelAnimationFrame = mockCancelAnimationFrame;

    TestBed.configureTestingModule({
      providers: [BatchResizeObserverService],
    });

    service = TestBed.inject(BatchResizeObserverService);
  });

  afterEach(() => {
    service.ngOnDestroy();
    vi.restoreAllMocks();
  });

  describe('observe', () => {
    it('should observe an element with metadata', () => {
      const el = document.createElement('div');
      const metadata: ObservedElementMetadata = { type: 'node', nodeId: 'n1' };

      service.observe(el, metadata);

      expect(mockResizeObserver.observe).toHaveBeenCalledWith(el);
      expect(service.getMetadata(el)).toEqual(metadata);
    });
  });

  describe('unobserve', () => {
    it('should unobserve an element', () => {
      const el = document.createElement('div');

      service.unobserve(el);

      expect(mockResizeObserver.unobserve).toHaveBeenCalledWith(el);
    });

    it('should remove metadata from observedElements', () => {
      const el = document.createElement('div');
      service.observe(el, { type: 'node', nodeId: 'n1' });

      service.unobserve(el);

      expect(service.getMetadata(el)).toBeUndefined();
    });

    it('should remove element from entity index', () => {
      const el = document.createElement('div');
      service.observe(el, { type: 'node', nodeId: 'n1' });

      service.unobserve(el);

      expect(service['entityIndex'].size).toBe(0);
    });

    it('should be safe to call on a never-observed element', () => {
      const el = document.createElement('div');

      expect(() => service.unobserve(el)).not.toThrow();
      expect(service['entityIndex'].size).toBe(0);
    });
  });

  describe('processBatch', () => {
    it('should process pending entries and call batch processor', () => {
      const mockEntries = [
        { target: document.createElement('div') },
        { target: document.createElement('span') },
      ] as unknown as ResizeObserverEntry[];

      const processor = vi.fn();
      service.configure({ processBatch: processor });

      service['pendingEntries'] = [...mockEntries];
      service['rafId'] = 123;

      service['processBatch']();

      expect(service['pendingEntries']).toEqual([]);
      expect(service['rafId']).toBeNull();
      expect(processor).toHaveBeenCalledWith(mockEntries);
    });

    it('should not call batch processor if no entries', () => {
      const processor = vi.fn();
      service.configure({ processBatch: processor });

      service['pendingEntries'] = [];
      service['processBatch']();

      expect(processor).not.toHaveBeenCalled();
    });

    it('should not throw if batch processor is not set', () => {
      service['pendingEntries'] = [
        {
          target: document.createElement('div'),
        } as unknown as ResizeObserverEntry,
      ];

      expect(() => service['processBatch']()).not.toThrow();
    });
  });

  describe('ResizeObserver callback', () => {
    it('should queue entries and schedule batch processing', () => {
      const mockEntries = [{ target: document.createElement('div') }] as unknown as ResizeObserverEntry[];

      const resizeObserverCallback = (global.ResizeObserver as Mock).mock.calls[0][0];

      resizeObserverCallback(mockEntries);

      expect(service['pendingEntries']).toEqual(mockEntries);
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('should not schedule multiple RAFs if one is already pending', () => {
      const mockEntries = [{ target: document.createElement('div') }] as unknown as ResizeObserverEntry[];
      const resizeObserverCallback = (global.ResizeObserver as Mock).mock.calls[0][0];

      service['rafId'] = 456;
      mockRequestAnimationFrame.mockClear();

      resizeObserverCallback(mockEntries);

      expect(mockRequestAnimationFrame).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should cancel pending animation frame and disconnect observer', () => {
      service['rafId'] = 123;

      service.ngOnDestroy();

      expect(mockCancelAnimationFrame).toHaveBeenCalledWith(123);
      expect(mockResizeObserver.disconnect).toHaveBeenCalled();
    });

    it('should not cancel animation frame if none is pending', () => {
      service['rafId'] = null;

      service.ngOnDestroy();

      expect(mockCancelAnimationFrame).not.toHaveBeenCalled();
      expect(mockResizeObserver.disconnect).toHaveBeenCalled();
    });

    it('should clear entity index', () => {
      service.observe(document.createElement('div'), { type: 'node', nodeId: 'n1' });

      service.ngOnDestroy();

      expect(service['entityIndex'].size).toBe(0);
    });
  });

  describe('getMetadata', () => {
    it('should return undefined for unobserved element', () => {
      const el = document.createElement('div');

      expect(service.getMetadata(el)).toBeUndefined();
    });

    it('should return metadata for observed element', () => {
      const el = document.createElement('div');
      const metadata: ObservedElementMetadata = {
        type: 'edge-label',
        edgeId: 'e1',
        labelId: 'l1',
      };

      service.observe(el, metadata);

      expect(service.getMetadata(el)).toEqual(metadata);
    });
  });

  describe('invalidate', () => {
    it('should re-observe a previously observed element', () => {
      const el = document.createElement('div');
      const metadata: ObservedElementMetadata = { type: 'port', nodeId: 'n1', portId: 'p1' };

      service.observe(el, metadata);
      mockResizeObserver.observe.mockClear();

      service.invalidate(el);

      expect(mockResizeObserver.observe).toHaveBeenCalledWith(el);
    });

    it('should be a no-op for an element that was never observed', () => {
      const el = document.createElement('div');

      service.invalidate(el);

      expect(mockResizeObserver.unobserve).not.toHaveBeenCalled();
      expect(mockResizeObserver.observe).not.toHaveBeenCalled();
    });
  });

  describe('entity index', () => {
    it('should index node element under node key', () => {
      const el = document.createElement('div');
      service.observe(el, { type: 'node', nodeId: 'n1' });

      expect(service['entityIndex'].get('node:n1')?.has(el)).toBe(true);
    });

    it('should index port element under node key', () => {
      const el = document.createElement('div');
      service.observe(el, { type: 'port', nodeId: 'n1', portId: 'p1' });

      expect(service['entityIndex'].get('node:n1')?.has(el)).toBe(true);
    });

    it('should index edge label under edge key', () => {
      const el = document.createElement('div');
      service.observe(el, { type: 'edge-label', edgeId: 'e1', labelId: 'l1' });

      expect(service['entityIndex'].get('edge:e1')?.has(el)).toBe(true);
    });

    it('should group node and its ports under the same node key', () => {
      const nodeEl = document.createElement('div');
      const portEl = document.createElement('span');
      service.observe(nodeEl, { type: 'node', nodeId: 'n1' });
      service.observe(portEl, { type: 'port', nodeId: 'n1', portId: 'p1' });

      const nodeSet = service['entityIndex'].get('node:n1')!;
      expect(nodeSet.size).toBe(2);
      expect(nodeSet.has(nodeEl)).toBe(true);
      expect(nodeSet.has(portEl)).toBe(true);
    });

    it('should clean up empty sets on unobserve', () => {
      const el = document.createElement('div');
      service.observe(el, { type: 'port', nodeId: 'n1', portId: 'p1' });

      service.unobserve(el);

      expect(service['entityIndex'].has('node:n1')).toBe(false);
    });

    it('should not remove key when other elements remain', () => {
      const el1 = document.createElement('div');
      const el2 = document.createElement('span');
      service.observe(el1, { type: 'port', nodeId: 'n1', portId: 'p1' });
      service.observe(el2, { type: 'port', nodeId: 'n1', portId: 'p2' });

      service.unobserve(el1);

      expect(service['entityIndex'].get('node:n1')?.size).toBe(1);
      expect(service['entityIndex'].get('node:n1')?.has(el2)).toBe(true);
    });
  });

  describe('invalidateNode', () => {
    it('should invalidate node element and all its ports', () => {
      const nodeEl = document.createElement('div');
      const portEl1 = document.createElement('span');
      const portEl2 = document.createElement('span');
      service.observe(nodeEl, { type: 'node', nodeId: 'n1' });
      service.observe(portEl1, { type: 'port', nodeId: 'n1', portId: 'p1' });
      service.observe(portEl2, { type: 'port', nodeId: 'n1', portId: 'p2' });
      mockResizeObserver.observe.mockClear();
      mockResizeObserver.unobserve.mockClear();

      service.invalidateNode('n1');

      expect(mockResizeObserver.unobserve).toHaveBeenCalledTimes(3);
      expect(mockResizeObserver.observe).toHaveBeenCalledTimes(3);
    });

    it('should be a no-op for unknown nodeId', () => {
      mockResizeObserver.observe.mockClear();
      mockResizeObserver.unobserve.mockClear();

      service.invalidateNode('unknown');

      expect(mockResizeObserver.unobserve).not.toHaveBeenCalled();
      expect(mockResizeObserver.observe).not.toHaveBeenCalled();
    });

    it('should not affect other nodes', () => {
      const el1 = document.createElement('div');
      const el2 = document.createElement('span');
      service.observe(el1, { type: 'node', nodeId: 'n1' });
      service.observe(el2, { type: 'node', nodeId: 'n2' });
      mockResizeObserver.observe.mockClear();
      mockResizeObserver.unobserve.mockClear();

      service.invalidateNode('n1');

      expect(mockResizeObserver.unobserve).toHaveBeenCalledTimes(1);
      expect(mockResizeObserver.observe).toHaveBeenCalledTimes(1);
      expect(mockResizeObserver.unobserve).toHaveBeenCalledWith(el1);
    });
  });

  describe('invalidateEdgeLabels', () => {
    it('should invalidate all labels on an edge', () => {
      const el1 = document.createElement('div');
      const el2 = document.createElement('span');
      service.observe(el1, { type: 'edge-label', edgeId: 'e1', labelId: 'l1' });
      service.observe(el2, { type: 'edge-label', edgeId: 'e1', labelId: 'l2' });
      mockResizeObserver.observe.mockClear();
      mockResizeObserver.unobserve.mockClear();

      service.invalidateEdgeLabels('e1');

      expect(mockResizeObserver.unobserve).toHaveBeenCalledTimes(2);
      expect(mockResizeObserver.observe).toHaveBeenCalledTimes(2);
    });

    it('should not invalidate labels on other edges', () => {
      const el1 = document.createElement('div');
      const el2 = document.createElement('span');
      service.observe(el1, { type: 'edge-label', edgeId: 'e1', labelId: 'l1' });
      service.observe(el2, { type: 'edge-label', edgeId: 'e2', labelId: 'l2' });
      mockResizeObserver.observe.mockClear();
      mockResizeObserver.unobserve.mockClear();

      service.invalidateEdgeLabels('e1');

      expect(mockResizeObserver.unobserve).toHaveBeenCalledTimes(1);
      expect(mockResizeObserver.observe).toHaveBeenCalledTimes(1);
    });

    it('should be a no-op for unknown edgeId', () => {
      mockResizeObserver.observe.mockClear();

      service.invalidateEdgeLabels('unknown');

      expect(mockResizeObserver.observe).not.toHaveBeenCalled();
    });
  });

  describe('invalidateAll', () => {
    it('should invalidate all observed elements', () => {
      const el1 = document.createElement('div');
      const el2 = document.createElement('span');
      const el3 = document.createElement('p');
      service.observe(el1, { type: 'node', nodeId: 'n1' });
      service.observe(el2, { type: 'port', nodeId: 'n1', portId: 'p1' });
      service.observe(el3, { type: 'edge-label', edgeId: 'e1', labelId: 'l1' });
      mockResizeObserver.observe.mockClear();
      mockResizeObserver.unobserve.mockClear();

      service.invalidateAll();

      expect(mockResizeObserver.unobserve).toHaveBeenCalledTimes(3);
      expect(mockResizeObserver.observe).toHaveBeenCalledTimes(3);
    });

    it('should be a no-op when nothing is observed', () => {
      mockResizeObserver.observe.mockClear();

      service.invalidateAll();

      expect(mockResizeObserver.observe).not.toHaveBeenCalled();
    });
  });

  describe('observer initialization', () => {
    it('should create ResizeObserver instance', () => {
      expect(global.ResizeObserver).toHaveBeenCalledTimes(1);
      expect(service['observer']).toBe(mockResizeObserver);
    });

    it('should initialize with empty state', () => {
      expect(service['pendingEntries']).toEqual([]);
      expect(service['rafId']).toBeNull();
    });
  });
});
