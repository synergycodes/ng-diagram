import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Edge } from '../../../core/src';
import { NgDiagramEdgeComponent } from './ng-diagram-edge.component';

@Component({
  template: `<ng-diagram-edge [edge]="edge()" />`,
  standalone: true,
  imports: [NgDiagramEdgeComponent],
})
class HostComponent {
  edge = signal<Edge>({ id: 'e1', source: 'a', target: 'b', data: {} } as Edge);
}

describe('NgDiagramEdgeComponent host display binding', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>;

  const edgeElement = (): HTMLElement => fixture.debugElement.query(By.directive(NgDiagramEdgeComponent)).nativeElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('sets no inline display value on a visible edge (user CSS stays in charge)', () => {
    expect(edgeElement().style.display).toBe('');
  });

  it('renders as display: none when effectively hidden, and stays mounted', () => {
    fixture.componentInstance.edge.set({ id: 'e1', source: 'a', target: 'b', data: {}, computedHidden: true } as Edge);
    fixture.detectChanges();

    expect(edgeElement().style.display).toBe('none');
    expect(edgeElement().isConnected).toBe(true);
  });

  it('drops the inline display value again when unhidden', () => {
    fixture.componentInstance.edge.set({ id: 'e1', source: 'a', target: 'b', data: {}, computedHidden: true } as Edge);
    fixture.detectChanges();
    fixture.componentInstance.edge.set({ id: 'e1', source: 'a', target: 'b', data: {}, computedHidden: false } as Edge);
    fixture.detectChanges();

    expect(edgeElement().style.display).toBe('');
  });
});
