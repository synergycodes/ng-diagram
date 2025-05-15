import { Component, Input, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  AngularAdapterDiagramComponent,
  FlowCoreProviderService,
  INodeTemplate,
  NodeTemplateMap,
} from '@angularflow/angular-adapter';
import { loggerMiddleware } from '@angularflow/logger-middleware';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SignalModelAdapter } from '@angularflow/angular-signals-model';
import { ModelAdapter } from '../../../../packages/core/dist/src/types';
import { AppComponent } from './app.component';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- Mocking library component that uses its own prefix
  selector: 'angular-adapter-diagram',
  template: '',
  standalone: true,
})
class MockAngularAdapterDiagramComponent {
  @Input() model: ModelAdapter = new SignalModelAdapter();
  @Input() nodeTemplateMap: NodeTemplateMap = new Map<string, Type<INodeTemplate>>();
}

const mockFlowCore = {
  registerMiddleware: vi.fn(),
  unregisterMiddleware: vi.fn(),
};

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let flowCoreProvider: FlowCoreProviderService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        {
          provide: FlowCoreProviderService,
          useValue: {
            provide: vi.fn().mockReturnValue(mockFlowCore),
          },
        },
      ],
    })
      .overrideComponent(AppComponent, {
        remove: {
          imports: [AngularAdapterDiagramComponent],
        },
        add: {
          imports: [MockAngularAdapterDiagramComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    flowCoreProvider = TestBed.inject(FlowCoreProviderService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with three nodes', () => {
    const nodes = component.model().getNodes();
    expect(nodes.length).toBe(4);
    expect(nodes[0].type).toBe('input-field');
    expect(nodes[1].type).toBe('image');
    expect(nodes[2].type).toBe('unknown');
    expect(nodes[3].type).toBe('resizable');
  });

  it('should have correct node template mappings', () => {
    expect(component.nodeTemplateMap.has('input-field')).toBeTruthy();
    expect(component.nodeTemplateMap.has('image')).toBeTruthy();
  });

  it('should initialize with two edges', () => {
    const edges = component.model().getEdges();
    expect(edges.length).toBe(2);
  });

  describe('after view init', () => {
    beforeEach(() => {
      const mockFlowCore = flowCoreProvider.provide();
      mockFlowCore.unregisterMiddleware(loggerMiddleware.name);
    });

    it('should register logger middleware', () => {
      const mockFlowCore = flowCoreProvider.provide();
      const spy = vi.spyOn(mockFlowCore, 'registerMiddleware');

      component.ngAfterViewInit();

      expect(spy).toHaveBeenCalledWith(loggerMiddleware);
    });
  });
});
