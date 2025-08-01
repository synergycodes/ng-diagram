import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { ViewportDirective } from '../../directives';
import { NgDiagramCanvasComponent } from './ng-diagram-canvas.component';

@Component({
  selector: 'ng-diagram-node',
  template: '<ng-content />',
})
class MockAngularAdapterNodeComponent {}

@Component({
  selector: 'angular-adapter-edge',
  template: '<ng-content />',
})
class MockAngularAdapterEdgeComponent {}

@Component({
  selector: 'ng-diagram-canvas-test',
  imports: [NgDiagramCanvasComponent, MockAngularAdapterNodeComponent, MockAngularAdapterEdgeComponent],
  template: `
    <ng-diagram-canvas>
      <angular-adapter-edge></angular-adapter-edge>
      <ng-diagram-node>Node 1</ng-diagram-node>
      <ng-diagram-node>Node 2</ng-diagram-node>
    </ng-diagram-canvas>
  `,
})
class TestComponent {}

describe('AngularAdapterCanvasComponent', () => {
  let component: NgDiagramCanvasComponent;
  let fixture: ComponentFixture<NgDiagramCanvasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgDiagramCanvasComponent, TestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NgDiagramCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render nodes and edges containers', () => {
    const nodesContainer = fixture.debugElement.query(By.css('.nodes-container'));
    const edgesContainer = fixture.debugElement.query(By.css('.edges-container'));

    expect(nodesContainer).toBeTruthy();
    expect(edgesContainer).toBeTruthy();
  });

  it('should have ViewportDirective as host directive', () => {
    const viewportDirective = fixture.debugElement.injector.get(ViewportDirective);
    expect(viewportDirective).toBeTruthy();
  });

  describe('content projection', () => {
    let testFixture: ComponentFixture<TestComponent>;

    beforeEach(() => {
      testFixture = TestBed.createComponent(TestComponent);
      testFixture.detectChanges();
    });

    it('should project nodes into nodes container', () => {
      const nodes = testFixture.debugElement.query(By.css('.nodes-container')).queryAll(By.css('ng-diagram-node'));

      expect(nodes.length).toBe(2);
      expect(nodes[0].nativeElement.textContent).toBe('Node 1');
      expect(nodes[1].nativeElement.textContent).toBe('Node 2');
    });

    it('should project edges into edges container', () => {
      const edges = testFixture.debugElement.query(By.css('.edges-container')).queryAll(By.css('angular-adapter-edge'));

      expect(edges.length).toBe(1);
    });
  });
});
