import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { ViewportDirective } from '../../directives';
import { AngularAdapterEdgeComponent } from '../edge/angular-adapter-edge.component';
import { AngularAdapterCanvasComponent } from './angular-adapter-canvas.component';

@Component({
  selector: 'angular-adapter-node',
  template: '<ng-content />',
})
class MockAngularAdapterNodeComponent {}

@Component({
  selector: 'angular-adapter-canvas-test',
  imports: [AngularAdapterCanvasComponent, MockAngularAdapterNodeComponent, AngularAdapterEdgeComponent],
  template: `
    <angular-adapter-canvas>
      <angular-adapter-edge></angular-adapter-edge>
      <angular-adapter-node>Node 1</angular-adapter-node>
      <angular-adapter-node>Node 2</angular-adapter-node>
    </angular-adapter-canvas>
  `,
})
class TestComponent {}

describe('AngularAdapterCanvasComponent', () => {
  let component: AngularAdapterCanvasComponent;
  let fixture: ComponentFixture<AngularAdapterCanvasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AngularAdapterCanvasComponent, TestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AngularAdapterCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render nodes edges container element', () => {
    const nodesEdgesContainer = fixture.debugElement.query(By.css('.nodes-edges-container'));
    expect(nodesEdgesContainer).toBeTruthy();
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

    it('should correctly project nodes and edges', () => {
      const nodes = testFixture.debugElement
        .query(By.css('.nodes-edges-container'))
        .queryAll(By.css('angular-adapter-node'));
      expect(nodes.length).toBe(2);
      expect(nodes[0].nativeElement.textContent).toBe('Node 1');
      expect(nodes[1].nativeElement.textContent).toBe('Node 2');

      const edges = testFixture.debugElement
        .query(By.css('.nodes-edges-container'))
        .queryAll(By.css('angular-adapter-edge'));
      expect(edges.length).toBe(1);
    });
  });
});
