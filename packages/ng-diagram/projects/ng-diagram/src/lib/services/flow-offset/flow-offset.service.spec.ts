import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';
import { FlowOffsetService } from './flow-offset.service';

describe('FlowOffsetService', () => {
  let service: FlowOffsetService;
  let mockElement: HTMLElement;
  let actionStateChangedCallback: (event: { actionState: Record<string, unknown> }) => void;
  let mockEventManager: { on: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockElement = {
      getBoundingClientRect: vi.fn().mockReturnValue({ left: 100, top: 200 }),
    } as unknown as HTMLElement;

    mockEventManager = {
      on: vi.fn().mockImplementation((event: string, cb: (event: { actionState: Record<string, unknown> }) => void) => {
        if (event === 'actionStateChanged') {
          actionStateChangedCallback = cb;
        }
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        FlowOffsetService,
        {
          provide: FlowCoreProviderService,
          useValue: {
            provide: vi.fn().mockReturnValue({ eventManager: mockEventManager }),
          },
        },
      ],
    });

    service = TestBed.inject(FlowOffsetService);
    service.initialize(mockElement);
  });

  describe('getFlowOffset', () => {
    it('should return element offset from getBoundingClientRect', () => {
      const offset = service.getFlowOffset();

      expect(offset).toEqual({ x: 100, y: 200 });
      expect(mockElement.getBoundingClientRect).toHaveBeenCalledOnce();
    });

    it('should call getBoundingClientRect on every call when no interaction is active', () => {
      service.getFlowOffset();
      service.getFlowOffset();
      service.getFlowOffset();

      expect(mockElement.getBoundingClientRect).toHaveBeenCalledTimes(3);
    });
  });

  describe('caching during interactions', () => {
    it('should cache offset during active interaction', () => {
      actionStateChangedCallback({ actionState: { dragging: { nodeIds: [] } } });

      service.getFlowOffset();
      service.getFlowOffset();
      service.getFlowOffset();

      expect(mockElement.getBoundingClientRect).toHaveBeenCalledOnce();
    });

    it('should return cached value during active interaction', () => {
      actionStateChangedCallback({ actionState: { dragging: { nodeIds: [] } } });

      const first = service.getFlowOffset();
      (mockElement.getBoundingClientRect as ReturnType<typeof vi.fn>).mockReturnValue({ left: 999, top: 999 });
      const second = service.getFlowOffset();

      expect(first).toEqual({ x: 100, y: 200 });
      expect(second).toEqual({ x: 100, y: 200 });
    });

    it('should clear cache when interaction ends', () => {
      actionStateChangedCallback({ actionState: { dragging: { nodeIds: [] } } });
      service.getFlowOffset();

      (mockElement.getBoundingClientRect as ReturnType<typeof vi.fn>).mockReturnValue({ left: 300, top: 400 });
      actionStateChangedCallback({ actionState: {} });

      const offset = service.getFlowOffset();
      expect(offset).toEqual({ x: 300, y: 400 });
    });

    it('should activate caching for linking interaction', () => {
      actionStateChangedCallback({ actionState: { linking: { sourceNodeId: '1' } } });

      service.getFlowOffset();
      service.getFlowOffset();

      expect(mockElement.getBoundingClientRect).toHaveBeenCalledOnce();
    });

    it('should activate caching for resize interaction', () => {
      actionStateChangedCallback({ actionState: { resize: { nodeId: '1' } } });

      service.getFlowOffset();
      service.getFlowOffset();

      expect(mockElement.getBoundingClientRect).toHaveBeenCalledOnce();
    });

    it('should activate caching for rotation interaction', () => {
      actionStateChangedCallback({ actionState: { rotation: { nodeId: '1' } } });

      service.getFlowOffset();
      service.getFlowOffset();

      expect(mockElement.getBoundingClientRect).toHaveBeenCalledOnce();
    });

    it('should activate caching for panning interaction', () => {
      actionStateChangedCallback({ actionState: { panning: { active: true } } });

      service.getFlowOffset();
      service.getFlowOffset();

      expect(mockElement.getBoundingClientRect).toHaveBeenCalledOnce();
    });

    it('should activate caching for selection interaction', () => {
      actionStateChangedCallback({ actionState: { selection: { selectionChanged: true } } });

      service.getFlowOffset();
      service.getFlowOffset();

      expect(mockElement.getBoundingClientRect).toHaveBeenCalledOnce();
    });

    it('should keep cache active when multiple interactions overlap', () => {
      actionStateChangedCallback({ actionState: { dragging: { nodeIds: [] }, panning: { active: true } } });
      service.getFlowOffset();

      // Dragging ends but panning still active
      actionStateChangedCallback({ actionState: { panning: { active: true } } });
      service.getFlowOffset();

      expect(mockElement.getBoundingClientRect).toHaveBeenCalledOnce();
    });

    it('should not write to state on repeated actionStateChanged during active interaction', () => {
      actionStateChangedCallback({ actionState: { dragging: { nodeIds: [] } } });
      service.getFlowOffset();

      // Modifiers change during drag — actionStateChanged fires again
      actionStateChangedCallback({ actionState: { dragging: { nodeIds: [], modifiers: { shift: true } } } });
      service.getFlowOffset();

      expect(mockElement.getBoundingClientRect).toHaveBeenCalledOnce();
    });
  });

  describe('invalidateCache', () => {
    it('should force fresh read on next getFlowOffset call', () => {
      actionStateChangedCallback({ actionState: { dragging: { nodeIds: [] } } });
      service.getFlowOffset();

      (mockElement.getBoundingClientRect as ReturnType<typeof vi.fn>).mockReturnValue({ left: 500, top: 600 });
      service.invalidateCache();

      const offset = service.getFlowOffset();
      expect(offset).toEqual({ x: 500, y: 600 });
    });

    it('should re-cache after invalidation during active interaction', () => {
      actionStateChangedCallback({ actionState: { dragging: { nodeIds: [] } } });
      service.getFlowOffset();

      service.invalidateCache();
      service.getFlowOffset();
      service.getFlowOffset();

      // Initial read + one re-read after invalidation
      expect(mockElement.getBoundingClientRect).toHaveBeenCalledTimes(2);
    });
  });

  describe('reset', () => {
    it('should clear cache and deactivate caching', () => {
      actionStateChangedCallback({ actionState: { dragging: { nodeIds: [] } } });
      service.getFlowOffset();

      service.reset();

      (mockElement.getBoundingClientRect as ReturnType<typeof vi.fn>).mockReturnValue({ left: 700, top: 800 });
      service.getFlowOffset();
      service.getFlowOffset();

      // Initial cached read + 2 uncached reads after reset
      expect(mockElement.getBoundingClientRect).toHaveBeenCalledTimes(3);
    });
  });

  describe('initialize', () => {
    it('should subscribe to actionStateChanged event', () => {
      expect(mockEventManager.on).toHaveBeenCalledWith('actionStateChanged', expect.any(Function));
    });

    it('should set the element for getBoundingClientRect calls', () => {
      service.getFlowOffset();

      expect(mockElement.getBoundingClientRect).toHaveBeenCalledOnce();
    });
  });
});
