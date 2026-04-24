import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { BatchDomObserverService, type ObservedElementMetadata } from './batch-dom-observer.service';

describe('BatchDomObserverService', () => {
  let service: BatchDomObserverService;
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
      providers: [BatchDomObserverService],
    });

    service = TestBed.inject(BatchDomObserverService);
  });

  afterEach(() => {
    service.ngOnDestroy();
    vi.restoreAllMocks();
  });

  describe('observeResize', () => {
    it('should observe an element with metadata', () => {
      const el = document.createElement('div');
      const metadata: ObservedElementMetadata = { type: 'node', nodeId: 'n1' };

      service.observeResize(el, metadata);

      expect(mockResizeObserver.observe).toHaveBeenCalledWith(el);
      expect(service.getMetadata(el)).toEqual(metadata);
    });
  });

  describe('unobserveResize', () => {
    it('should unobserve an element', () => {
      const el = document.createElement('div');

      service.unobserveResize(el);

      expect(mockResizeObserver.unobserve).toHaveBeenCalledWith(el);
    });
  });

  describe('processBatch', () => {
    it('should process pending entries and call batch processor', () => {
      const mockEntries = [
        { target: document.createElement('div') },
        { target: document.createElement('span') },
      ] as unknown as ResizeObserverEntry[];

      const processor = vi.fn();
      service.setBatchProcessor(processor);

      service['pendingEntries'] = [...mockEntries];
      service['rafId'] = 123;

      service['processBatch']();

      expect(service['pendingEntries']).toEqual([]);
      expect(service['rafId']).toBeNull();
      expect(processor).toHaveBeenCalledWith(mockEntries);
    });

    it('should not call batch processor if no entries', () => {
      const processor = vi.fn();
      service.setBatchProcessor(processor);

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

      service.observeResize(el, metadata);

      expect(service.getMetadata(el)).toEqual(metadata);
    });
  });

  describe('invalidate', () => {
    it('should re-observe a previously observed element', () => {
      const el = document.createElement('div');
      const metadata: ObservedElementMetadata = { type: 'port', nodeId: 'n1', portId: 'p1' };

      service.observeResize(el, metadata);
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
