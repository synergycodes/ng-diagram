import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventMapperService, UpdatePortsService } from '../../../services';
import { NodeRotateAdornmentComponent } from './node-rotate-adornment.component';

describe('NodeRotateAdornmentComponent', () => {
  let component: NodeRotateAdornmentComponent;
  let fixture: ComponentFixture<NodeRotateAdornmentComponent>;
  let eventMapper: EventMapperService;
  let portsService: UpdatePortsService;

  const mockNode = { id: 'node-1', selected: true } as any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeRotateAdornmentComponent],
      providers: [
        { provide: EventMapperService, useValue: { emit: vi.fn() } },
        { provide: UpdatePortsService, useValue: { getNodePortsData: vi.fn(() => []) } },
        {
          provide: ElementRef,
          useValue: { nativeElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NodeRotateAdornmentComponent);
    component = fixture.componentInstance;
    eventMapper = TestBed.inject(EventMapperService);
    portsService = TestBed.inject(UpdatePortsService);
    fixture.componentRef.setInput('data', mockNode);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show adornment if node is selected', () => {
    expect(component.showAdornment()).toBe(true);
  });

  it('should set isRotating to true on pointer down', () => {
    const event = {
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
      pointerId: 1,
      target: { setPointerCapture: vi.fn() },
    } as any;
    component.onPointerDownEvent({ event });
    expect(component.isRotating()).toBe(true);
  });

  it('should emit rotate event on pointer move', () => {
    const moveEvent = {
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
      pointerId: 1,
      clientX: 10,
      clientY: 20,
    } as any;
    // Mock the read-only hostElement and handleNode using Object.defineProperty
    Object.defineProperty(component, 'hostElement', {
      value: { nativeElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) } },
    });
    Object.defineProperty(component, 'handleNode', {
      value: () => ({ nativeElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 24, height: 24 }) } }),
    });
    const emitSpy = vi.spyOn(eventMapper, 'emit');
    component['onPointerMove'](moveEvent, 1);
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should set isRotating to false on pointer up', () => {
    const upEvent = {
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
      pointerId: 1,
      target: { hasPointerCapture: () => true, releasePointerCapture: vi.fn() },
    } as any;
    const moveListener = vi.fn();
    const upListener = vi.fn();
    const lostCaptureListener = vi.fn();
    component['isRotating'].set(true);
    component['onPointerUp'](upEvent, 1, upEvent.target, moveListener, upListener, lostCaptureListener);
    expect(component.isRotating()).toBe(false);
  });

  it('should set isRotating to false on lost pointer capture', () => {
    const lostEvent = { pointerId: 1 } as any;
    const moveListener = vi.fn();
    const upListener = vi.fn();
    const lostCaptureListener = vi.fn();
    component['isRotating'].set(true);
    component['onLostPointerCapture'](lostEvent, 1, moveListener, upListener, lostCaptureListener);
    expect(component.isRotating()).toBe(false);
  });
});
