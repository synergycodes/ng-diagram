import { Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BatchResizeObserverService } from '../../services/flow-resize-observer/batched-resize-observer.service';
import { NodeSizeDirective } from './node-size.directive';

@Component({
  template: `<div ngDiagramNodeSize [data]="data"></div>`,
  imports: [NodeSizeDirective],
})
class TestComponent {
  data = {};
}

describe('NodeSizeDirective', () => {
  let directive: NodeSizeDirective;
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;

  let mockBatchResizeObserver: {
    observe: ReturnType<typeof vi.fn>;
    unobserve: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockBatchResizeObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [{ provide: BatchResizeObserverService, useValue: mockBatchResizeObserver }],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    directive = fixture.debugElement.query(By.directive(NodeSizeDirective)).injector.get(NodeSizeDirective);
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

  it('should disconnect resize observer on destroy', () => {
    const element = fixture.debugElement.query(By.directive(NodeSizeDirective)).nativeElement;
    fixture.destroy();
    expect(mockBatchResizeObserver.unobserve).toHaveBeenCalledWith(element);
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
