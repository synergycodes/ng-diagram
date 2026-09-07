import type { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Node } from '../../../../core/src';
import { RendererService } from '../../../services/renderer/renderer.service';
import { NgDiagramMinimapNodeTemplate, NgDiagramMinimapNodeTemplateMap } from '../ng-diagram-minimap.types';
import { DirectMinimapStrategy } from './direct-minimap-strategy';

const node = (id: string, overrides: Partial<Node> = {}): Node =>
  ({
    id,
    type: 'default',
    position: { x: 0, y: 0 },
    size: { width: 100, height: 50 },
    measuredBounds: { x: 0, y: 0, width: 100, height: 50 },
    data: {},
    ...overrides,
  }) as Node;

describe('DirectMinimapStrategy', () => {
  let strategy: DirectMinimapStrategy;
  let renderer: RendererService;
  const templateMap = new NgDiagramMinimapNodeTemplateMap();

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [DirectMinimapStrategy, RendererService] });
    strategy = TestBed.inject(DirectMinimapStrategy);
    renderer = TestBed.inject(RendererService);
  });

  describe('computeMinimapNodes', () => {
    it('excludes effectively hidden nodes', () => {
      renderer.nodes.set([node('visible'), node('hidden', { hidden: true, computedHidden: true })]);

      const minimapNodes = strategy.computeMinimapNodes(undefined, templateMap);

      expect(minimapNodes.map((data) => data.diagramNode.id)).toEqual(['visible']);
    });

    it('excludes children hidden through an ancestor group', () => {
      // The child carries no own flag — only the computedHidden stamp derived
      // from its hidden ancestor. The minimap must read effective visibility.
      renderer.nodes.set([
        node('group', { isGroup: true, hidden: true, computedHidden: true } as Partial<Node>),
        node('child', { groupId: 'group', computedHidden: true }),
        node('outsider'),
      ]);

      const minimapNodes = strategy.computeMinimapNodes(undefined, templateMap);

      expect(minimapNodes.map((data) => data.diagramNode.id)).toEqual(['outsider']);
    });

    it('excludes hidden nodes that have a custom minimap template', () => {
      class FakeTemplate {}
      const map = new NgDiagramMinimapNodeTemplateMap([['custom', FakeTemplate as Type<NgDiagramMinimapNodeTemplate>]]);
      renderer.nodes.set([
        node('templated-hidden', { type: 'custom', hidden: true, computedHidden: true }),
        node('templated-visible', { type: 'custom' }),
      ]);

      const minimapNodes = strategy.computeMinimapNodes(undefined, map);

      expect(minimapNodes).toHaveLength(1);
      expect(minimapNodes[0].diagramNode.id).toBe('templated-visible');
      expect(minimapNodes[0].template).toBe(FakeTemplate);
    });

    it('reflects runtime toggling both ways', () => {
      renderer.nodes.set([node('a'), node('b')]);
      expect(strategy.computeMinimapNodes(undefined, templateMap)).toHaveLength(2);

      // A toggle produces a new node object in the model — the per-node cache
      // must not resurrect the stale visible entry.
      renderer.nodes.set([node('a'), node('b', { hidden: true, computedHidden: true })]);
      expect(strategy.computeMinimapNodes(undefined, templateMap).map((data) => data.diagramNode.id)).toEqual(['a']);

      renderer.nodes.set([node('a'), node('b')]);
      const restored = strategy.computeMinimapNodes(undefined, templateMap);
      expect(restored.map((data) => data.diagramNode.id)).toEqual(['a', 'b']);
      expect(restored[1].bounds.id).toBe('b');
    });
  });

  describe('computeDiagramBounds', () => {
    it('excludes effectively hidden nodes from the bounds', () => {
      renderer.nodes.set([
        node('near'),
        node('far-hidden', {
          hidden: true,
          computedHidden: true,
          position: { x: 5000, y: 5000 },
          measuredBounds: { x: 5000, y: 5000, width: 100, height: 50 },
        }),
      ]);

      expect(strategy.computeDiagramBounds()).toEqual({ x: 0, y: 0, width: 100, height: 50 });
    });

    it('expands the bounds again when the node is unhidden', () => {
      const far = {
        position: { x: 500, y: 300 },
        measuredBounds: { x: 500, y: 300, width: 100, height: 50 },
      };
      renderer.nodes.set([node('near'), node('far', { ...far, hidden: true, computedHidden: true })]);
      expect(strategy.computeDiagramBounds()).toEqual({ x: 0, y: 0, width: 100, height: 50 });

      renderer.nodes.set([node('near'), node('far', far)]);
      expect(strategy.computeDiagramBounds()).toEqual({ x: 0, y: 0, width: 600, height: 350 });
    });

    it('falls back to a zero rect when every node is hidden', () => {
      renderer.nodes.set([node('only', { hidden: true, computedHidden: true })]);

      expect(strategy.computeDiagramBounds()).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });
  });
});
