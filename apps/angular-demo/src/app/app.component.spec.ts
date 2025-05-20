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

  it('should initialize with three nodes', () => {
    const nodes = component.model().getNodes();
    expect(nodes.length).toBe(3);
    expect(nodes[0].type).toBe('image');
    expect(nodes[1].type).toBe('input-field');
    expect(nodes[2].type).toBe('resizable');
  });

  it('should have correct node template mappings', () => {
    expect(component.nodeTemplateMap.has('input-field')).toBeTruthy();
    expect(component.nodeTemplateMap.has('image')).toBeTruthy();
    expect(component.nodeTemplateMap.has('resizable')).toBeTruthy();
  });

  it('should initialize with two edges', () => {
    const edges = component.model().getEdges();
    expect(edges.length).toBe(4);
  });

  it('should initialize with logger middleware', () => {
    const middlewares = component.middlewares();
    expect(middlewares.length).toBe(1);
    expect(middlewares[0].name).toBe('logger');
  });
});
