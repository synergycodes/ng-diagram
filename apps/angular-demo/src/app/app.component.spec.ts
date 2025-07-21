import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  AngularAdapterDiagramComponent,
  EdgeTemplateMap,
  FlowCoreProviderService,
  Middleware,
  NodeTemplateMap,
} from '@angularflow/angular-adapter';
import { SignalModelAdapter } from '@angularflow/angular-signals-model';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppComponent } from './app.component';
import { PaletteComponent } from './palette/palette.component';
import { ToolbarComponent } from './toolbar/toolbar.component';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- Mocking library component that uses its own prefix
  selector: 'angular-adapter-diagram',
  template: '',
  standalone: true,
})
class MockAngularAdapterDiagramComponent {
  model = input.required<SignalModelAdapter>();
  nodeTemplateMap = input.required<NodeTemplateMap>();
  edgeTemplateMap = input.required<EdgeTemplateMap>();
  middlewares = input.required<Middleware[]>();
}

@Component({
  selector: 'app-toolbar',
  template: '',
  standalone: true,
})
class MockToolbarComponent {}

@Component({
  selector: 'app-palette',
  template: '',
  standalone: true,
})
class MockPaletteComponent {}

class MockEventMapper {
  private listener: (event: Event) => void = () => null;

  register(callback: (event: Event) => void): void {
    this.listener = callback;
  }
}

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  const mockGetScale = vi.fn(() => 1);
  let mockEventMapper: MockEventMapper;

  beforeEach(async () => {
    mockEventMapper = new MockEventMapper();

    await TestBed.configureTestingModule({
      providers: [
        {
          provide: FlowCoreProviderService,
          useValue: {
            provide: vi.fn().mockReturnValue({
              getScale: mockGetScale,
              registerEventsHandler: (handle: (event: Event) => void) => mockEventMapper.register(handle),
              getEnvironment: vi.fn(),
            }),
          },
        },
      ],
      imports: [AppComponent],
    })
      .overrideComponent(AppComponent, {
        remove: {
          imports: [AngularAdapterDiagramComponent, ToolbarComponent, PaletteComponent],
        },
        add: {
          imports: [MockAngularAdapterDiagramComponent, MockToolbarComponent, MockPaletteComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct node template mappings', () => {
    expect(component.nodeTemplateMap.has('input-field')).toBeTruthy();
    expect(component.nodeTemplateMap.has('image')).toBeTruthy();
    expect(component.nodeTemplateMap.has('resizable')).toBeTruthy();
  });

  it('should initialize with three edges', () => {
    const edges = component.model().getEdges();
    expect(edges.length).toBe(3);
  });

  it('should initialize with logger middleware', () => {
    const middlewares = component.middlewares();
    expect(middlewares.length).toBe(8);
    expect(middlewares[7].name).toBe('logger');
  });
});
