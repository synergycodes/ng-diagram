import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Node } from '../../../core/src';
import { FlowCoreProviderService, UpdatePortsService } from '../../services';
import { NgDiagramNodeComponent } from './ng-diagram-node.component';

@Component({
  template: `<ng-diagram-node [node]="node()" />`,
  standalone: true,
  imports: [NgDiagramNodeComponent],
})
class HostComponent {
  node = signal<Node>({ id: 'n1', position: { x: 0, y: 0 }, data: {} } as Node);
}

describe('NgDiagramNodeComponent host display binding', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>;

  const nodeElement = (): HTMLElement => fixture.debugElement.query(By.directive(NgDiagramNodeComponent)).nativeElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        { provide: UpdatePortsService, useValue: { getNodePortsData: vi.fn().mockReturnValue([]) } },
        {
          provide: FlowCoreProviderService,
          useValue: {
            isInitialized: () => true,
            provide: () => ({
              actionStateManager: { isResizing: () => false },
              updater: { applyPortChanges: vi.fn() },
            }),
          },
        },
      ],
    });
    // The host display binding is what is under test — the content template and
    // the interaction host directives are irrelevant and carry heavy DI.
    TestBed.overrideComponent(NgDiagramNodeComponent, { set: { template: '', hostDirectives: [] } });

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('sets no inline display value on a visible node (user CSS stays in charge)', () => {
    expect(nodeElement().style.display).toBe('');
  });

  it('renders as display: none when effectively hidden, and stays mounted', () => {
    fixture.componentInstance.node.set({ id: 'n1', position: { x: 0, y: 0 }, data: {}, computedHidden: true } as Node);
    fixture.detectChanges();

    expect(nodeElement().style.display).toBe('none');
    expect(nodeElement().isConnected).toBe(true);
  });

  it('drops the inline display value again when unhidden', () => {
    fixture.componentInstance.node.set({ id: 'n1', position: { x: 0, y: 0 }, data: {}, computedHidden: true } as Node);
    fixture.detectChanges();
    fixture.componentInstance.node.set({ id: 'n1', position: { x: 0, y: 0 }, data: {}, computedHidden: false } as Node);
    fixture.detectChanges();

    expect(nodeElement().style.display).toBe('');
  });
});
