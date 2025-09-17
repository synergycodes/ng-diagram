import { Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { type Node } from '@ng-diagram/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCoreProviderService } from '../../services/flow-core-provider/flow-core-provider.service';
import { BatchResizeObserverService } from '../../services/flow-resize-observer/batched-resize-observer.service';
import { DEFAULT_GROUP_SIZE, DEFAULT_NODE_SIZE, NodeSizeDirective } from './node-size.directive';

@Component({
  template: `<div ngDiagramNodeSize [node]="data"></div>`,
  imports: [NodeSizeDirective],
})
class TestComponent {
  data: Node = { id: 'test-node', position: { x: 0, y: 0 }, data: {} };
}

describe('NodeSizeDirective', () => {
  let directive: NodeSizeDirective;
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;
  let element: HTMLElement;

  let mockBatchResizeObserver: {
    observe: ReturnType<typeof vi.fn>;
    unobserve: ReturnType<typeof vi.fn>;
  };

  let mockFlowCore: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let mockFlowCoreProvider: {
    provide: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockBatchResizeObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
    };

    mockFlowCore = {
      config: {
        resize: {
          getMinNodeSize: vi.fn().mockReturnValue({ width: 20, height: 20 }),
        },
      },
    };

    mockFlowCoreProvider = {
      provide: vi.fn().mockReturnValue(mockFlowCore),
    };

    await TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [
        { provide: BatchResizeObserverService, useValue: mockBatchResizeObserver },
        { provide: FlowCoreProviderService, useValue: mockFlowCoreProvider },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    directive = fixture.debugElement.query(By.directive(NodeSizeDirective)).injector.get(NodeSizeDirective);
    element = fixture.debugElement.query(By.directive(NodeSizeDirective)).nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  describe('Explicit Sizing (autoSize=false)', () => {
    it('should apply explicit width and height when size is provided', () => {
      component.data = {
        id: 'node1',
        position: { x: 0, y: 0 },
        data: {},
        autoSize: false,
        size: { width: 100, height: 200 },
      };
      fixture.detectChanges();

      expect(element.style.width).toBe('100px');
      expect(element.style.height).toBe('200px');
    });

    it('should apply minimum constraints for default nodes', () => {
      component.data = {
        id: 'node1',
        position: { x: 0, y: 0 },
        data: {},
        autoSize: false,
        size: { width: 100, height: 200 },
      };
      fixture.detectChanges();

      expect(element.style.minWidth).toBe('20px');
      expect(element.style.minHeight).toBe('20px');
    });

    it('should apply minimum constraints for custom nodes when config provides them', () => {
      mockFlowCore.config.resize.getMinNodeSize.mockReturnValue({ width: 30, height: 30 });
      component.data = {
        id: 'node1',
        type: 'custom',
        position: { x: 0, y: 0 },
        data: {},
        autoSize: false,
        size: { width: 100, height: 200 },
      };
      fixture.detectChanges();

      expect(element.style.minWidth).toBe('30px');
      expect(element.style.minHeight).toBe('30px');
    });

    it('should update size when node changes from auto to explicit sizing', () => {
      component.data = { id: 'node1', position: { x: 0, y: 0 }, data: {} };
      fixture.detectChanges();

      component.data = {
        id: 'node1',
        position: { x: 0, y: 0 },
        data: {},
        autoSize: false,
        size: { width: 300, height: 400 },
      };
      fixture.detectChanges();

      expect(element.style.width).toBe('300px');
      expect(element.style.height).toBe('400px');
    });
  });

  describe('Auto Sizing - Default Node Types', () => {
    it('should apply default size for regular nodes without type', () => {
      component.data = { id: 'node1', position: { x: 0, y: 0 }, data: {} };
      fixture.detectChanges();

      expect(element.style.width).toBe('unset');
      expect(element.style.height).toBe('unset');
      expect(element.style.minWidth).toBe(DEFAULT_NODE_SIZE.width);
      expect(element.style.minHeight).toBe(DEFAULT_NODE_SIZE.height);
    });

    it('should apply default size for group nodes without type', () => {
      component.data = { id: 'group1', position: { x: 0, y: 0 }, data: {}, isGroup: true };
      fixture.detectChanges();

      expect(element.style.width).toBe(DEFAULT_GROUP_SIZE.width);
      expect(element.style.height).toBe(DEFAULT_GROUP_SIZE.height);
      expect(element.style.minWidth).toBe(DEFAULT_GROUP_SIZE.width);
      expect(element.style.minHeight).toBe(DEFAULT_GROUP_SIZE.height);
    });
  });

  describe('Auto Sizing - Custom Node Types', () => {
    it('should reset styles for custom nodes', () => {
      component.data = { id: 'node1', type: 'custom', position: { x: 0, y: 0 }, data: {} };
      fixture.detectChanges();

      expect(element.style.width).toBe('unset');
      expect(element.style.height).toBe('unset');
      expect(element.style.minWidth).toBe('unset');
      expect(element.style.minHeight).toBe('unset');
    });

    it('should reset styles for custom group nodes', () => {
      component.data = { id: 'group1', type: 'custom-group', position: { x: 0, y: 0 }, data: {}, isGroup: true };
      fixture.detectChanges();

      expect(element.style.width).toBe('unset');
      expect(element.style.height).toBe('unset');
      expect(element.style.minWidth).toBe('unset');
      expect(element.style.minHeight).toBe('unset');
    });
  });

  describe('Lifecycle', () => {
    it('should connect resize observer on init', () => {
      expect(mockBatchResizeObserver.observe).toHaveBeenCalledWith(element, {
        type: 'node',
        nodeId: 'test-node',
      });
    });

    it('should disconnect resize observer on destroy', () => {
      fixture.destroy();
      expect(mockBatchResizeObserver.unobserve).toHaveBeenCalledWith(element);
    });
  });

  describe('Group vs Regular Node Behavior', () => {
    it('should apply fixed dimensions for default groups in auto-size mode', () => {
      component.data = { id: 'group1', position: { x: 0, y: 0 }, data: {}, isGroup: true };
      fixture.detectChanges();

      // Groups should get both width/height and min-width/min-height
      expect(element.style.width).toBe(DEFAULT_GROUP_SIZE.width);
      expect(element.style.height).toBe(DEFAULT_GROUP_SIZE.height);
      expect(element.style.minWidth).toBe(DEFAULT_GROUP_SIZE.width);
      expect(element.style.minHeight).toBe(DEFAULT_GROUP_SIZE.height);
    });

    it('should apply flexible sizing for default regular nodes in auto-size mode', () => {
      component.data = { id: 'node1', position: { x: 0, y: 0 }, data: {} };
      fixture.detectChanges();

      // Regular nodes should only get min-width/min-height
      expect(element.style.width).toBe('unset');
      expect(element.style.height).toBe('unset');
      expect(element.style.minWidth).toBe(DEFAULT_NODE_SIZE.width);
      expect(element.style.minHeight).toBe(DEFAULT_NODE_SIZE.height);
    });
  });

  describe('Edge Cases', () => {
    it('should handle nodes without size property gracefully', () => {
      component.data = { id: 'node1', position: { x: 0, y: 0 }, data: {}, autoSize: false };
      fixture.detectChanges();

      // Should not throw and should apply default behavior
      expect(directive).toBeTruthy();
    });

    it('should handle transition from explicit to auto sizing', () => {
      // Start with explicit size
      component.data = {
        id: 'node1',
        position: { x: 0, y: 0 },
        data: {},
        autoSize: false,
        size: { width: 200, height: 100 },
      };
      fixture.detectChanges();
      expect(element.style.width).toBe('200px');

      // Switch to auto size
      component.data = { id: 'node1', position: { x: 0, y: 0 }, data: {} };
      fixture.detectChanges();
      expect(element.style.width).toBe('unset');
      expect(element.style.minWidth).toBe(DEFAULT_NODE_SIZE.width);
    });
  });
});
