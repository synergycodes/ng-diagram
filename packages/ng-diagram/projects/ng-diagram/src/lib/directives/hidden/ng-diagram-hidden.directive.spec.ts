import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { FlowCore, TemplateVisibilityRegistry } from '../../../core/src';
import { NgDiagramEdgeComponent } from '../../components/edge/ng-diagram-edge.component';
import { NgDiagramNodeComponent } from '../../components/node/ng-diagram-node.component';
import { FlowCoreProviderService } from '../../services';
import { NgDiagramHiddenDirective } from './ng-diagram-hidden.directive';

@Component({
  template: `<div [ngDiagramHidden]="hidden()"></div>`,
  imports: [NgDiagramHiddenDirective],
})
class TestComponent {
  hidden = signal(false);
}

interface MutableFlowCore {
  templateVisibilityRegistry: TemplateVisibilityRegistry;
  isInitialized: boolean;
  isVirtualizationActive: boolean;
  getNodeById: (id: string) => unknown;
  getEdgeById: (id: string) => unknown;
}

describe('NgDiagramHiddenDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let registry: TemplateVisibilityRegistry;
  let flowCore: MutableFlowCore;

  const setup = (providers: { nodeId?: string; edgeId?: string; internalId?: string }) => {
    registry = new TemplateVisibilityRegistry();
    const node = providers.nodeId ? { id: providers.nodeId, _internalId: providers.internalId } : undefined;
    const edge = providers.edgeId ? { id: providers.edgeId, _internalId: providers.internalId } : undefined;
    flowCore = {
      templateVisibilityRegistry: registry,
      isInitialized: true,
      isVirtualizationActive: false,
      getNodeById: () => node ?? null,
      getEdgeById: () => edge ?? null,
    };

    TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [
        {
          provide: FlowCoreProviderService,
          useValue: { provide: () => flowCore as unknown as FlowCore },
        },
        ...(node ? [{ provide: NgDiagramNodeComponent, useValue: { node: () => node } }] : []),
        ...(edge ? [{ provide: NgDiagramEdgeComponent, useValue: { edge: () => edge } }] : []),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
  };

  it('should write node hidden state to the registry inside a node template', () => {
    setup({ nodeId: 'node1' });

    fixture.componentInstance.hidden.set(true);
    fixture.detectChanges();

    expect(registry.isNodeHidden('node1')).toBe(true);

    fixture.componentInstance.hidden.set(false);
    fixture.detectChanges();

    expect(registry.isNodeHidden('node1')).toBe(false);
  });

  it('should write edge hidden state to the registry inside an edge template', () => {
    setup({ edgeId: 'edge1' });

    fixture.componentInstance.hidden.set(true);
    fixture.detectChanges();

    expect(registry.isEdgeHidden('edge1')).toBe(true);
  });

  it('should prefer the node context when both are present', () => {
    setup({ nodeId: 'node1', edgeId: 'edge1' });

    fixture.componentInstance.hidden.set(true);
    fixture.detectChanges();

    expect(registry.isNodeHidden('node1')).toBe(true);
    expect(registry.isEdgeHidden('edge1')).toBe(false);
  });

  it('should clear its declaration on destroy', () => {
    setup({ nodeId: 'node1' });

    fixture.componentInstance.hidden.set(true);
    fixture.detectChanges();
    expect(registry.isNodeHidden('node1')).toBe(true);

    fixture.destroy();

    expect(registry.isNodeHidden('node1')).toBe(false);
  });

  it('should not clear the declaration when the element was replaced with the same id', () => {
    setup({ nodeId: 'node1', internalId: 'instance-1' });

    fixture.componentInstance.hidden.set(true);
    fixture.detectChanges();

    // The node was replaced: a new instance (new _internalId) now owns the
    // entry — this template's teardown must not wipe it.
    flowCore.getNodeById = () => ({ id: 'node1', _internalId: 'instance-2' });

    fixture.destroy();

    expect(registry.isNodeHidden('node1')).toBe(true);
  });

  it('should not touch the registry on destroy while a new FlowCore initializes', () => {
    setup({ nodeId: 'node1' });

    fixture.componentInstance.hidden.set(true);
    fixture.detectChanges();

    flowCore.isInitialized = false;

    fixture.destroy();

    expect(registry.isNodeHidden('node1')).toBe(true);
  });

  it('should not clear the declaration when the element was deleted', () => {
    setup({ nodeId: 'node1' });

    fixture.componentInstance.hidden.set(true);
    fixture.detectChanges();

    flowCore.getNodeById = () => null;

    fixture.destroy();

    expect(registry.isNodeHidden('node1')).toBe(true);
  });

  it('should be an ignored no-op with a console warning when virtualization is active', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    setup({ nodeId: 'node1' });
    flowCore.isVirtualizationActive = true;

    fixture.componentInstance.hidden.set(true);
    fixture.detectChanges();

    expect(registry.isNodeHidden('node1')).toBe(false);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('virtualization');

    // Toggling again does not repeat the warning, and destroy stays a no-op.
    fixture.componentInstance.hidden.set(false);
    fixture.detectChanges();
    fixture.componentInstance.hidden.set(true);
    fixture.detectChanges();
    expect(warnSpy).toHaveBeenCalledTimes(1);

    fixture.destroy();
    expect(registry.isNodeHidden('node1')).toBe(false);
    warnSpy.mockRestore();
  });

  it('should be an ignored no-op with a one-shot console warning outside a node or edge template', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // Neither NgDiagramNodeComponent nor NgDiagramEdgeComponent in the
    // injector — the binding has no owner to resolve.
    setup({});

    fixture.componentInstance.hidden.set(true);
    fixture.detectChanges();

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('inside a node or edge template');

    // Repeated toggles do not flood the console, and destroy is a no-op.
    fixture.componentInstance.hidden.set(false);
    fixture.detectChanges();
    fixture.componentInstance.hidden.set(true);
    fixture.detectChanges();
    expect(warnSpy).toHaveBeenCalledTimes(1);

    fixture.destroy();
    warnSpy.mockRestore();
  });
});
