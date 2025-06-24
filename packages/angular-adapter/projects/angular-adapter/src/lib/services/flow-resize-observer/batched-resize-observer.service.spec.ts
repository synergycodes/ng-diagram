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
    // Mock ResizeObserver globally for realistic testing
    mockResizeObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };

    global.ResizeObserver = vi.fn().mockImplementation(() => mockResizeObserver);

    // Mock RAF functions
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
  });

  describe('processBatch', () => {
    it('should process pending entries and call batch processor', () => {
      const mockEntries = [
        { target: document.createElement('div') },
        { target: document.createElement('span') },
      ] as unknown as ResizeObserverEntry[];

      const processor = vi.fn();
      service.setBatchProcessor(processor);

      // Set up pending entries using type-safe interface
      service['pendingEntries'] = [...mockEntries];
      service['rafId'] = 123;

      // Call private method using type-safe interface
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

      // Get the callback passed to ResizeObserver constructor
      const resizeObserverCallback = (global.ResizeObserver as Mock).mock.calls[0][0];

      // Simulate ResizeObserver firing
      resizeObserverCallback(mockEntries);

      expect(service['pendingEntries']).toEqual(mockEntries);
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('should not schedule multiple RAFs if one is already pending', () => {
      const mockEntries = [{ target: document.createElement('div') }] as unknown as ResizeObserverEntry[];
      const resizeObserverCallback = (global.ResizeObserver as Mock).mock.calls[0][0];

      // Set existing rafId using type-safe interface
      service['rafId'] = 456;

      resizeObserverCallback(mockEntries);

      // Should not call requestAnimationFrame again
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

      service.observe(el, metadata);

      expect(service.getMetadata(el)).toEqual(metadata);
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
