import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowCore } from '@angularflow/core';
import { EventMapperService, FlowCoreProviderService, UpdatePortsService } from '../../services';
import { AngularAdapterNodeComponent } from '../node/angular-adapter-node.component';
import { AngularAdapterPortComponent } from './angular-adapter-port.component';

describe('AngularAdapterPortComponent', () => {
  let component: AngularAdapterPortComponent;
  let fixture: ComponentFixture<AngularAdapterPortComponent>;
  let flowCore: FlowCore;

  beforeEach(async () => {
    flowCore = {
      commandHandler: {
        emit: vi.fn(),
      },
    } as unknown as FlowCore;
    await TestBed.configureTestingModule({
      imports: [AngularAdapterPortComponent],
      providers: [
        { provide: EventMapperService, useValue: { emit: vi.fn() } },
        {
          provide: AngularAdapterNodeComponent,
          useValue: { data: vi.fn().mockReturnValue({ id: 'test-node-id', ports: [{ id: 'test-port-id' }] }) },
        },
        { provide: UpdatePortsService, useValue: { updateNodePorts: vi.fn(), getPortData: vi.fn() } },
        { provide: FlowCoreProviderService, useValue: { provide: () => flowCore } },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AngularAdapterPortComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', 'test-port-id');
    fixture.componentRef.setInput('type', 'both');
    fixture.componentRef.setInput('side', 'left');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onPointerDown', () => {
    let mockEvent: PointerEvent;

    beforeEach(() => {
      mockEvent = new Event('pointerdown') as PointerEvent;
      Object.assign(mockEvent, { clientX: 100, clientY: 200, pointerId: 1, pressure: 0.5, button: 0 });
    });

    it('should stop event propagation', () => {
      const spy = vi.spyOn(mockEvent, 'stopPropagation');

      component.onPointerDown(mockEvent);

      expect(spy).toHaveBeenCalled();
    });

    it('should emit pointer down event with correct data', () => {
      const spy = vi.spyOn(TestBed.inject(EventMapperService), 'emit');

      component.onPointerDown(mockEvent);

      expect(spy).toHaveBeenCalledWith({
        pointerId: 1,
        type: 'pointerdown',
        target: {
          type: 'port',
          element: {
            id: 'test-port-id',
          },
        },
        pressure: 0.5,
        timestamp: expect.any(Number),
        x: 100,
        y: 200,
        button: 0,
      });
    });

    it('should throw an error if the port is not found', () => {
      fixture.componentRef.setInput('id', 'test-port-id-not-found');
      fixture.detectChanges();

      component.onPointerDown(mockEvent);

      expect(() => component.onPointerDown(mockEvent)).toThrowError();
    });
  });

  describe('onPointerUp', () => {
    let mockEvent: PointerEvent;

    beforeEach(() => {
      mockEvent = new Event('pointerup') as PointerEvent;
      Object.assign(mockEvent, { clientX: 150, clientY: 250, pointerId: 1, pressure: 0, button: 0 });
    });

    it('should stop event propagation', () => {
      const spy = vi.spyOn(mockEvent, 'stopPropagation');

      component.onPointerUp(mockEvent);

      expect(spy).toHaveBeenCalled();
    });

    it('should emit pointer up event with correct data', () => {
      const spy = vi.spyOn(TestBed.inject(EventMapperService), 'emit');

      component.onPointerUp(mockEvent);

      expect(spy).toHaveBeenCalledWith({
        pointerId: 1,
        type: 'pointerup',
        target: {
          type: 'port',
          element: {
            id: 'test-port-id',
          },
        },
        pressure: 0,
        timestamp: expect.any(Number),
        x: 150,
        y: 250,
        button: 0,
      });
    });
  });
});
