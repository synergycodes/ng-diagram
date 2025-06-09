import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Node } from '@angularflow/core';
import { MockedFunction, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventMapperService, UpdatePortsService } from '../../../services';
import { NodeRotateAdornmentComponent } from './node-rotate-adornment.component';

interface MockEventMapperService {
  emit: MockedFunction<(event: unknown) => void>;
}

interface MockUpdatePortsService {
  getNodePortsData: MockedFunction<(nodeId: string) => unknown[]>;
}

interface MockPointerEvent extends Partial<PointerEvent> {
  pointerId: number;
  clientX: number;
  clientY: number;
  target: HTMLElement;
  stopPropagation: MockedFunction<() => void>;
  preventDefault: MockedFunction<() => void>;
}

interface MockHTMLElement extends Partial<HTMLElement> {
  setPointerCapture: MockedFunction<(pointerId: number) => void>;
  hasPointerCapture: MockedFunction<(pointerId: number) => boolean>;
  releasePointerCapture: MockedFunction<(pointerId: number) => void>;
  getBoundingClientRect: MockedFunction<() => DOMRect>;
}

describe('NodeRotateAdornmentComponent', () => {
  let component: NodeRotateAdornmentComponent;
  let fixture: ComponentFixture<NodeRotateAdornmentComponent>;
  let mockNode: Node;
  let mockEventMapper: MockEventMapperService;
  let mockPortsService: MockUpdatePortsService;

  // Common mock objects
  let mockTarget: MockHTMLElement;
  let mockPointerDownEvent: MockPointerEvent;
  let mockPointerMoveEvent: MockPointerEvent;
  let mockPointerUpEvent: MockPointerEvent;
  let eventListeners: Map<string, (ev: Event) => void>;

  beforeEach(async () => {
    // Setup services
    mockEventMapper = { emit: vi.fn() };
    mockPortsService = { getNodePortsData: vi.fn().mockReturnValue([]) };
    eventListeners = new Map();

    // Setup common mock objects
    mockTarget = {
      setPointerCapture: vi.fn(),
      hasPointerCapture: vi.fn().mockReturnValue(true),
      releasePointerCapture: vi.fn(),
      getBoundingClientRect: vi.fn().mockReturnValue({ left: 60, top: 60, width: 24, height: 24 } as DOMRect),
    };

    mockPointerDownEvent = {
      target: mockTarget as HTMLElement,
      pointerId: 1,
      clientX: 100,
      clientY: 100,
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
    };

    mockPointerMoveEvent = {
      pointerId: 1,
      clientX: 150,
      clientY: 150,
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
      target: mockTarget as HTMLElement,
    };

    mockPointerUpEvent = {
      pointerId: 1,
      clientX: 150,
      clientY: 150,
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
      target: mockTarget as HTMLElement,
    };

    // Mock window event listeners to capture registered listeners
    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener) => {
      eventListeners.set(type, listener as (ev: Event) => void);
    });

    vi.spyOn(window, 'removeEventListener').mockImplementation((type) => {
      eventListeners.delete(type);
    });

    // Setup component
    await TestBed.configureTestingModule({
      imports: [NodeRotateAdornmentComponent],
      providers: [
        { provide: EventMapperService, useValue: mockEventMapper },
        { provide: UpdatePortsService, useValue: mockPortsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NodeRotateAdornmentComponent);
    mockNode = { id: '1', type: 'default', position: { x: 0, y: 0 }, selected: false, data: {} };
    fixture.componentRef.setInput('data', mockNode);
    component = fixture.componentInstance;

    // Mock host element getBoundingClientRect
    vi.spyOn(fixture.debugElement.nativeElement, 'getBoundingClientRect').mockReturnValue({
      left: 50,
      top: 50,
      width: 200,
      height: 200,
    } as DOMRect);

    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rotation interaction', () => {
    it('should show adornment when node is selected or rotating', () => {
      // Not selected, not rotating
      expect(component.showAdornment()).toBe(false);

      // Selected
      fixture.componentRef.setInput('data', { ...mockNode, selected: true });
      fixture.detectChanges();
      expect(component.showAdornment()).toBe(true);

      // Not selected but rotating
      fixture.componentRef.setInput('data', mockNode);
      component.isRotating.set(true);
      expect(component.showAdornment()).toBe(true);
    });

    it('should start rotation on pointer down', () => {
      component.onPointerDownEvent({ event: mockPointerDownEvent as PointerEvent });

      expect(component.isRotating()).toBe(true);
      expect(mockPointerDownEvent.stopPropagation).toHaveBeenCalled();
      expect(mockPointerDownEvent.preventDefault).toHaveBeenCalled();
      expect(mockTarget.setPointerCapture).toHaveBeenCalledWith(1);
      expect(eventListeners.size).toBe(3); // move, up, lostcapture
    });

    it('should emit rotate events during pointer move', () => {
      // Start rotation
      component.onPointerDownEvent({ event: mockPointerDownEvent as PointerEvent });

      // Simulate move
      const moveListener = eventListeners.get('pointermove')!;
      moveListener(mockPointerMoveEvent as PointerEvent);

      expect(mockEventMapper.emit).toHaveBeenCalledWith({
        type: 'rotate',
        timestamp: expect.any(Number),
        target: { type: 'rotate-handle', element: mockNode },
        mouse: { x: 150, y: 150 },
        center: { x: 150, y: 150 }, // 50 + 200/2
        handle: { x: 0, y: 0 }, // no handle element
        ports: [],
      });
    });

    it('should end rotation on pointer up with proper cleanup', () => {
      // Start rotation
      component.onPointerDownEvent({ event: mockPointerDownEvent as PointerEvent });
      expect(component.isRotating()).toBe(true);

      // End rotation
      const upListener = eventListeners.get('pointerup')!;
      upListener(mockPointerUpEvent as PointerEvent);

      expect(component.isRotating()).toBe(false);
      expect(mockTarget.releasePointerCapture).toHaveBeenCalledWith(1);
      expect(window.removeEventListener).toHaveBeenCalledTimes(3); // move, up, lostcapture
    });

    it('should end rotation on lost pointer capture', () => {
      // Start rotation
      component.onPointerDownEvent({ event: mockPointerDownEvent as PointerEvent });
      expect(component.isRotating()).toBe(true);

      // Lost capture
      const lostCaptureListener = eventListeners.get('lostpointercapture')!;
      lostCaptureListener(mockPointerUpEvent as PointerEvent);

      expect(component.isRotating()).toBe(false);
      expect(window.removeEventListener).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge cases', () => {
    it('should ignore events from different pointer IDs', () => {
      // Start rotation with pointer ID 1
      component.onPointerDownEvent({ event: mockPointerDownEvent as PointerEvent });

      // Try to move with pointer ID 2
      const differentPointerEvent = { ...mockPointerMoveEvent, pointerId: 2 };
      const moveListener = eventListeners.get('pointermove')!;
      moveListener(differentPointerEvent as PointerEvent);

      expect(mockEventMapper.emit).not.toHaveBeenCalled();
    });

    it('should include handle position when handle element exists', () => {
      // Mock handle element
      const mockElementRef = { nativeElement: mockTarget } as ElementRef<HTMLElement>;
      Object.defineProperty(component, 'handleNode', {
        get: () => () => mockElementRef,
        configurable: true,
      });

      // Start rotation and move
      component.onPointerDownEvent({ event: mockPointerDownEvent as PointerEvent });
      const moveListener = eventListeners.get('pointermove')!;
      moveListener(mockPointerMoveEvent as PointerEvent);

      expect(mockEventMapper.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          handle: { x: 72, y: 72 }, // 60 + 24/2
        })
      );
    });
  });
});
