import { beforeEach, describe, expect, it } from 'vitest';
import { Component } from '@angular/core';
import { AngularAdapterCanvasComponent } from './angular-adapter-canvas.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewportDirective } from '../../directives';
import { By } from '@angular/platform-browser';
import { AngularAdapterCanvasComponent } from './angular-adapter-canvas.component';

@Component({
  selector: 'angular-adapter-node',
  template: '<ng-content />',
})
class MockAngularAdapterNodeComponent {}

@Component({
  selector: 'angular-adapter-edge',
  template: '<ng-content />',
})
class MockAngularAdapterEdgeComponent {}

@Component({
  selector: 'angular-adapter-canvas-test',
  imports: [AngularAdapterCanvasComponent, MockAngularAdapterNodeComponent, MockAngularAdapterEdgeComponent],
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
      const nodes = testFixture.debugElement.query(By.css('.nodes-container')).queryAll(By.css('angular-adapter-node'));

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
