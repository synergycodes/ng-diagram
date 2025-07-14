import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AngularAdapterDiagramComponent, Middleware, NodeTemplateMap } from '@angularflow/angular-adapter';
import { SignalModelAdapter } from '@angularflow/angular-signals-model';
import { beforeEach, describe, expect, it } from 'vitest';

import { AppComponent } from './app.component';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- Mocking library component that uses its own prefix
  selector: 'angular-adapter-diagram',
  template: '',
  standalone: true,
})
class MockAngularAdapterDiagramComponent {
  model = input.required<SignalModelAdapter>();
  nodeTemplateMap = input.required<NodeTemplateMap>();
  middlewares = input.required<Middleware[]>();
}

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AppComponent] })
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
