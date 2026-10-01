import { NgTemplateOutlet } from '@angular/common';
import { Component, signal, type TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

/** FlowCoreProviderService stub with just what the node component's port sync reads. */
const flowCoreStub = (applyPortChanges = vi.fn(), isResizing = () => false) => ({
  provide: FlowCoreProviderService,
  useValue: {
    isInitialized: () => true,
    provide: () => ({
      actionStateManager: { isResizing },
      updater: { applyPortChanges },
      getState: () => ({ metadata: { viewport: { scale: 1 } } }),
    }),
  },
});

const sizedNode = (width: number) =>
  ({ id: 'n1', position: { x: 0, y: 0 }, data: {}, size: { width, height: 40 } }) as Node;

describe('NgDiagramNodeComponent host display binding', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>;

  const nodeElement = (): HTMLElement => fixture.debugElement.query(By.directive(NgDiagramNodeComponent)).nativeElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        { provide: UpdatePortsService, useValue: { getNodePortsData: vi.fn().mockReturnValue([]) } },
        flowCoreStub(),
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

describe('NgDiagramNodeComponent port measurement', () => {
  const measuredPort = { id: 'p1', size: { width: 4, height: 4 }, position: { x: 1, y: 2 } };

  let fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>;
  let getNodePortsData: ReturnType<typeof vi.fn>;
  let applyPortChanges: ReturnType<typeof vi.fn>;
  let isResizing: boolean;

  const nodeElement = (): HTMLElement => fixture.debugElement.query(By.directive(NgDiagramNodeComponent)).nativeElement;

  const setNodeWidth = (width: number) => {
    fixture.componentInstance.node.set(sizedNode(width));
    fixture.detectChanges();
  };

  beforeEach(() => {
    getNodePortsData = vi.fn().mockReturnValue([measuredPort]);
    applyPortChanges = vi.fn();
    isResizing = false;

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        { provide: UpdatePortsService, useValue: { getNodePortsData } },
        flowCoreStub(applyPortChanges, () => isResizing),
      ],
    });
    TestBed.overrideComponent(NgDiagramNodeComponent, { set: { template: '', hostDirectives: [] } });

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('does not measure ports on the first render (the resize observer delivers the initial measurement)', async () => {
    await Promise.resolve();

    expect(getNodePortsData).not.toHaveBeenCalled();
  });

  it('measures the ports on its own host element after a size change', async () => {
    setNodeWidth(200);
    await Promise.resolve();

    expect(getNodePortsData).toHaveBeenCalledExactlyOnceWith(nodeElement());
    expect(applyPortChanges).toHaveBeenCalledExactlyOnceWith('n1', [
      { portId: 'p1', portChanges: { size: measuredPort.size, position: measuredPort.position } },
    ]);
  });

  it('measures synchronously while a resize gesture is active', () => {
    isResizing = true;

    setNodeWidth(200);

    expect(getNodePortsData).toHaveBeenCalledExactlyOnceWith(nodeElement());
    expect(applyPortChanges).toHaveBeenCalledOnce();
  });

  it('drops the queued measurement when the node is destroyed before it runs', async () => {
    setNodeWidth(200);
    fixture.destroy();
    await Promise.resolve();

    expect(getNodePortsData).not.toHaveBeenCalled();
    expect(applyPortChanges).not.toHaveBeenCalled();
  });
});

@Component({
  selector: 'ng-diagram-test-provider',
  template: `
    <ng-template #canvas>
      <ng-diagram-node [node]="node()">
        <div data-port-id="p1"></div>
      </ng-diagram-node>
    </ng-template>
  `,
  standalone: true,
  imports: [NgDiagramNodeComponent],
  providers: [UpdatePortsService],
})
class ProviderComponent {
  readonly canvas = viewChild<TemplateRef<unknown>>('canvas');
  readonly node = signal<Node>({ id: 'n1', position: { x: 0, y: 0 }, data: {} } as Node);
}

@Component({
  template: `
    <ng-diagram-test-provider />
    <ng-container *ngTemplateOutlet="provider().canvas() ?? null" />
  `,
  standalone: true,
  imports: [ProviderComponent, NgTemplateOutlet],
})
class OutletParentComponent {
  readonly provider = viewChild.required(ProviderComponent);
}

describe('NgDiagramNodeComponent rendered outside the component that provides the services', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<OutletParentComponent>>;
  let applyPortChanges: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    applyPortChanges = vi.fn();

    TestBed.configureTestingModule({
      imports: [OutletParentComponent],
      providers: [flowCoreStub(applyPortChanges)],
    });
    TestBed.overrideComponent(NgDiagramNodeComponent, { set: { template: '<ng-content />', hostDirectives: [] } });

    fixture = TestBed.createComponent(OutletParentComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('measures the ports with the real service although the node is not inside the provider host', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const provider = fixture.debugElement.query(By.directive(ProviderComponent));
    const node = fixture.debugElement.query(By.directive(NgDiagramNodeComponent));
    expect(provider.nativeElement.contains(node.nativeElement)).toBe(false);

    provider.componentInstance.node.set(sizedNode(200));
    fixture.detectChanges();
    await Promise.resolve();

    expect(applyPortChanges).toHaveBeenCalledExactlyOnceWith('n1', [expect.objectContaining({ portId: 'p1' })]);
    expect(consoleError).not.toHaveBeenCalled();
  });
});
