import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { AngularAdapterNodeComponent } from '../node/angular-adapter-node.component';
import { AngularAdapterCanvasComponent } from './angular-adapter-canvas.component';

@Component({
  selector: 'angular-adapter-canvas-test',
  imports: [AngularAdapterCanvasComponent, AngularAdapterNodeComponent],
  template: `
    <angular-adapter-canvas>
      <angular-adapter-node>Node 1</angular-adapter-node>
      <angular-adapter-node>Node 2</angular-adapter-node>
    </angular-adapter-canvas>
  `,
})
class TestComponent {}

describe('AngularAdapterCanvasComponent', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render nodes container element', () => {
    const nodesContainer = fixture.debugElement.query(By.css('.nodes-container'));
    expect(nodesContainer).toBeTruthy();
  });

  it('should correctly project nodes', () => {
    const nodes = fixture.debugElement.query(By.css('.nodes-container')).queryAll(By.css('angular-adapter-node'));
    expect(nodes.length).toBe(2);
    expect(nodes[0].nativeElement.textContent).toBe('Node 1');
    expect(nodes[1].nativeElement.textContent).toBe('Node 2');
  });
});
