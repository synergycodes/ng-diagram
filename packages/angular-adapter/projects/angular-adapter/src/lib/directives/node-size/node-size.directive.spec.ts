import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventMapperService } from '../../services';
import { NodeSizeDirective } from './node-size.directive';

type ResizeObserverCallback = (entries: ResizeObserverEntry[]) => void;

class MockResizeObserver implements ResizeObserver {
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(): void {
    // do nothing
  }

  unobserve(): void {
    // do nothing
  }

  disconnect(): void {
    // do nothing
  }
}

describe('NodeSizeDirective', () => {
  let directive: NodeSizeDirective;
  let fixture: ComponentFixture<TestComponent>;
  let eventMapperService: EventMapperService;

  @Component({
    template: `<div
      angularAdapterNodeSize
      [sizeControlled]="sizeControlled"
      [size]="size"
      [eventTarget]="eventTarget"
    ></div>`,
    standalone: true,
    imports: [NodeSizeDirective],
  })
  class TestComponent {
    sizeControlled = false;
    size?: { width: number; height: number };
    eventTarget = { type: 'diagram' };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [EventMapperService],
    }).compileComponents();

    global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
    fixture = TestBed.createComponent(TestComponent);
    directive = fixture.debugElement.query(By.directive(NodeSizeDirective)).injector.get(NodeSizeDirective);
    eventMapperService = TestBed.inject(EventMapperService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should set size when sizeControlled is true and size is provided', () => {
    const spy = vi.spyOn(directive as unknown as { setSize: (width: number, height: number) => void }, 'setSize');
    fixture.componentInstance.sizeControlled = true;
    fixture.componentInstance.size = { width: 100, height: 200 };
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith(100, 200);
  });

  it('should create resize observer when sizeControlled is false', () => {
    const spy = vi.spyOn(directive as unknown as { createResizeObserver: () => void }, 'createResizeObserver');
    fixture.componentInstance.sizeControlled = true;
    fixture.detectChanges();
    fixture.componentInstance.sizeControlled = false;
    fixture.detectChanges();

    expect(spy).toHaveBeenCalled();
  });

  it('should disconnect resize observer when sizeControlled is true and size is provided', () => {
    const spy = vi.spyOn(directive as unknown as { disconnectResizeObserver: () => void }, 'disconnectResizeObserver');
    fixture.componentInstance.sizeControlled = true;
    fixture.componentInstance.size = { width: 100, height: 200 };
    fixture.detectChanges();

    expect(spy).toHaveBeenCalled();
  });

  it('should emit resize event when element is resized', () => {
    const emitSpy = vi.spyOn(eventMapperService, 'emit');
    fixture.componentInstance.eventTarget = { type: 'diagram' };
    fixture.detectChanges();

    const resizeCallback = (directive as unknown as { resizeObserver: { callback: ResizeObserverCallback } })
      .resizeObserver.callback;
    resizeCallback([
      {
        borderBoxSize: [
          {
            inlineSize: 150,
            blockSize: 250,
          },
        ],
        contentBoxSize: [],
        contentRect: new DOMRect(),
        devicePixelContentBoxSize: [],
        target: document.createElement('div'),
      } as ResizeObserverEntry,
    ]);

    expect(emitSpy).toHaveBeenCalledWith({
      type: 'resize',
      target: { type: 'diagram' },
      width: 150,
      height: 250,
      timestamp: expect.any(Number),
    });
  });

  it('should disconnect resize observer on destroy', () => {
    const spy = vi.spyOn(directive as unknown as { disconnectResizeObserver: () => void }, 'disconnectResizeObserver');
    fixture.destroy();
    expect(spy).toHaveBeenCalled();
  });

  it('should update size when size input changes', () => {
    const setSizeSpy = vi.spyOn(
      directive as unknown as { setSize: (width: number, height: number) => void },
      'setSize'
    );
    fixture.componentInstance.sizeControlled = true;
    fixture.componentInstance.size = { width: 100, height: 200 };
    fixture.detectChanges();

    fixture.componentInstance.size = { width: 300, height: 400 };
    fixture.detectChanges();

    expect(setSizeSpy).toHaveBeenCalledWith(300, 400);
  });
});
