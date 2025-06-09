import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventMapperService, FlowCoreProviderService, UpdatePortsService } from '../../services';
import { NodeSizeDirective } from './node-size.directive';

type ResizeObserverCallback = (entries: ResizeObserverEntry[]) => void;

class MockResizeObserver implements ResizeObserver {
  callback: ResizeObserverCallback = vi.fn();
  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();
}

@Component({
  template: `<div angularAdapterNodeSize [data]="data"></div>`,
  imports: [NodeSizeDirective],
})
class TestComponent {
  data = {};
}

describe('NodeSizeDirective', () => {
  let directive: NodeSizeDirective;
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;
  let applyNodeSizeMock: ReturnType<typeof vi.fn>;
  let applyPortSizesAndPositionsMock: ReturnType<typeof vi.fn>;
  let updatePortsService: UpdatePortsService;
  let mockResizeObserver: MockResizeObserver;

  beforeEach(async () => {
    applyNodeSizeMock = vi.fn();
    applyPortSizesAndPositionsMock = vi.fn();
    mockResizeObserver = new MockResizeObserver();
    global.ResizeObserver = function (callback: ResizeObserverCallback) {
      mockResizeObserver.callback = callback;
      return mockResizeObserver;
    } as unknown as typeof ResizeObserver;

    // Mock service
    const mockUpdatePortsService = {
      getNodePortsData: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [
        EventMapperService,
        { provide: UpdatePortsService, useValue: mockUpdatePortsService },
        {
          provide: FlowCoreProviderService,
          useValue: {
            provide: vi.fn().mockReturnValue({
              internalUpdater: {
                applyNodeSize: applyNodeSizeMock,
                applyPortsSizesAndPositions: applyPortSizesAndPositionsMock,
              },
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    directive = fixture.debugElement.query(By.directive(NodeSizeDirective)).injector.get(NodeSizeDirective);
    updatePortsService = TestBed.inject(UpdatePortsService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should update element size when autoSize is false and size is provided', () => {
    const element = fixture.debugElement.query(By.directive(NodeSizeDirective)).nativeElement;
    component.data = { autoSize: false, size: { width: 100, height: 200 } };
    fixture.detectChanges();

    expect(element.style.width).toBe('100px');
    expect(element.style.height).toBe('200px');
  });

  it('should observe size changes when autoSize is true', () => {
    const getNodePortsDataSpy = vi.spyOn(updatePortsService, 'getNodePortsData').mockReturnValue([]);
    const element = fixture.debugElement.query(By.directive(NodeSizeDirective)).nativeElement;

    component.data = { autoSize: true, id: 'test-node-id' };
    fixture.detectChanges();

    Object.defineProperty(element, 'offsetWidth', { value: 150 });
    Object.defineProperty(element, 'offsetHeight', { value: 250 });

    mockResizeObserver.callback([
      {
        borderBoxSize: [{ inlineSize: 150, blockSize: 250 }],
        contentBoxSize: [],
        contentRect: new DOMRect(),
        devicePixelContentBoxSize: [],
        target: element,
      } as ResizeObserverEntry,
    ]);

    expect(applyNodeSizeMock).toHaveBeenCalledWith('test-node-id', {
      size: { width: 150, height: 250 },
    });
    expect(applyPortSizesAndPositionsMock).toHaveBeenCalledWith('test-node-id', []);
    expect(getNodePortsDataSpy).toHaveBeenCalledWith('test-node-id');
  });

  it('should disconnect resize observer on destroy', () => {
    fixture.destroy();
    expect(mockResizeObserver.disconnect).toHaveBeenCalled();
  });

  it('should update element size when size input changes', () => {
    const element = fixture.debugElement.query(By.directive(NodeSizeDirective)).nativeElement;
    component.data = { autoSize: false, size: { width: 100, height: 200 } };
    fixture.detectChanges();

    component.data = { autoSize: false, size: { width: 300, height: 400 } };
    fixture.detectChanges();

    expect(element.style.width).toBe('300px');
    expect(element.style.height).toBe('400px');
  });
});
