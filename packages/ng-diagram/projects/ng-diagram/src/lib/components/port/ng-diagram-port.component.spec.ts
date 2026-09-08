import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowCore, TemplateVisibilityRegistry } from '../../../core/src';
import { FlowCoreProviderService } from '../../services';
import { BatchResizeObserverService } from '../../services/flow-resize-observer/batched-resize-observer.service';
import { InputEventsRouterService } from '../../services/input-events/input-events-router.service';
import { TouchEventsStateService } from '../../services/touch-events-state-service/touch-events-state-service.service';
import { NgDiagramNodeComponent } from '../node/ng-diagram-node.component';
import { NgDiagramPortComponent } from './ng-diagram-port.component';

@Component({
  template: `<ng-diagram-port [id]="'port1'" [type]="'source'" [side]="'right'" [hidden]="hidden()" />`,
  imports: [NgDiagramPortComponent],
})
class TestComponent {
  hidden = signal(false);
}

describe('NgDiagramPortComponent hidden input', () => {
  let fixture: ComponentFixture<TestComponent>;
  let registry: TemplateVisibilityRegistry;
  let addPort: ReturnType<typeof vi.fn>;
  let flowCore: Partial<FlowCore>;

  const createFixture = (initiallyHidden = false, template?: string) => {
    registry = new TemplateVisibilityRegistry();
    addPort = vi.fn();
    flowCore = {
      templateVisibilityRegistry: registry,
      updater: { addPort } as unknown as FlowCore['updater'],
      isInitialized: true,
      getNodeById: vi.fn().mockReturnValue({ id: 'node1' }),
      isVirtualizationActive: false,
      internalUpdater: { deletePort: vi.fn() } as unknown as FlowCore['internalUpdater'],
    };

    TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [
        {
          provide: FlowCoreProviderService,
          useValue: { provide: () => flowCore as FlowCore },
        },
        {
          provide: BatchResizeObserverService,
          useValue: { observe: vi.fn(), unobserve: vi.fn(), invalidate: vi.fn() },
        },
        {
          provide: InputEventsRouterService,
          useValue: { getBaseEvent: vi.fn(), emit: vi.fn() },
        },
        {
          provide: TouchEventsStateService,
          useValue: { isTouchInteraction: vi.fn().mockReturnValue(false) },
        },
        {
          provide: NgDiagramNodeComponent,
          useValue: { node: () => ({ id: 'node1' }) },
        },
      ],
    });
    if (template) {
      TestBed.overrideComponent(TestComponent, { set: { template } });
    }
    TestBed.compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    if (initiallyHidden) {
      fixture.componentInstance.hidden.set(true);
    }
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('should render as display: none when hidden', () => {
    createFixture(true);

    const host: HTMLElement = fixture.debugElement.query(By.css('ng-diagram-port')).nativeElement;
    expect(host.style.display).toBe('none');
  });

  it('should render as display: block when visible inside a node', () => {
    createFixture(false);

    const host: HTMLElement = fixture.debugElement.query(By.css('ng-diagram-port')).nativeElement;
    expect(host.style.display).toBe('block');
  });

  it('should treat the static attribute form as hidden', () => {
    createFixture(false, `<ng-diagram-port [id]="'port1'" [type]="'source'" [side]="'right'" hidden />`);

    const host: HTMLElement = fixture.debugElement.query(By.css('ng-diagram-port')).nativeElement;
    expect(host.style.display).toBe('none');
    expect(registry.isPortHidden('node1', 'port1')).toBe(true);
  });

  it('should declare hidden state in the registry before registering the port', () => {
    const calls: string[] = [];
    createFixture(true);

    // The registry write happened before addPort — the port never counted
    // as a measurement expectation.
    expect(registry.isPortHidden('node1', 'port1')).toBe(true);
    expect(addPort).toHaveBeenCalledWith('node1', expect.objectContaining({ id: 'port1' }));
    expect(calls).toEqual([]);
  });

  it('should not write the registry when visible at init', () => {
    createFixture(false);

    expect(registry.isPortHidden('node1', 'port1')).toBe(false);
  });

  it('should toggle the registry at runtime', () => {
    createFixture(false);

    fixture.componentInstance.hidden.set(true);
    fixture.detectChanges();
    expect(registry.isPortHidden('node1', 'port1')).toBe(true);

    fixture.componentInstance.hidden.set(false);
    fixture.detectChanges();
    expect(registry.isPortHidden('node1', 'port1')).toBe(false);
  });

  it('should clear its registry declaration on destroy', () => {
    createFixture(true);
    expect(registry.isPortHidden('node1', 'port1')).toBe(true);

    fixture.destroy();

    expect(registry.isPortHidden('node1', 'port1')).toBe(false);
  });

  it('should keep its registry declaration when destroyed by virtualization (node scrolled out)', () => {
    createFixture(true);
    expect(registry.isPortHidden('node1', 'port1')).toBe(true);

    // The node is virtualized out — the port unmounts but still exists in the
    // model; the hidden declaration must survive so the port is not a snap
    // target while off-screen.
    (flowCore as { isVirtualizationActive?: boolean }).isVirtualizationActive = true;
    (flowCore as { isNodeCurrentlyRendered?: (id: string) => boolean }).isNodeCurrentlyRendered = () => false;

    fixture.destroy();

    expect(registry.isPortHidden('node1', 'port1')).toBe(true);
  });
});
