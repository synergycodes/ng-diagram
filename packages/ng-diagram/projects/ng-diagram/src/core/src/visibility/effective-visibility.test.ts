import { describe, expect, it } from 'vitest';
import type { Edge, Node } from '../types';
import {
  computeHiddenNodeIds,
  isEdgeEffectivelyHidden,
  isEdgeRawHidden,
  isNodeRawHidden,
} from './effective-visibility';
import { TemplateVisibilityRegistry } from './template-visibility-registry';

describe('effective visibility', () => {
  const createNode = (id: string, overrides: Partial<Node> = {}): Node => ({
    id,
    position: { x: 0, y: 0 },
    data: {},
    ...overrides,
  });

  const createEdge = (id: string, source: string, target: string, overrides: Partial<Edge> = {}): Edge => ({
    id,
    source,
    target,
    data: {},
    ...overrides,
  });

  describe('computeHiddenNodeIds', () => {
    it('should return an empty set when nothing is hidden', () => {
      const nodes = [createNode('a'), createNode('b', { groupId: 'a' })];

      expect(computeHiddenNodeIds(nodes).size).toBe(0);
    });

    it('should include nodes with their own hidden flag', () => {
      const nodes = [createNode('a', { hidden: true }), createNode('b')];

      const hidden = computeHiddenNodeIds(nodes);

      expect(hidden.has('a')).toBe(true);
      expect(hidden.has('b')).toBe(false);
    });

    it('should hide all descendants of a hidden group', () => {
      const nodes = [
        createNode('group', { hidden: true }),
        createNode('child', { groupId: 'group' }),
        createNode('grandchild', { groupId: 'child' }),
        createNode('unrelated'),
      ];

      const hidden = computeHiddenNodeIds(nodes);

      expect(hidden).toEqual(new Set(['group', 'child', 'grandchild']));
    });

    it('should hide a node when an ancestor further up the chain is hidden', () => {
      const nodes = [
        createNode('root', { hidden: true }),
        createNode('middle', { groupId: 'root' }),
        createNode('leaf', { groupId: 'middle' }),
      ];

      expect(computeHiddenNodeIds(nodes).has('leaf')).toBe(true);
    });

    it('should treat false hidden flag as visible', () => {
      const nodes = [createNode('a', { hidden: false })];

      expect(computeHiddenNodeIds(nodes).size).toBe(0);
    });

    it('should not hide a node whose parent is missing from the model', () => {
      const nodes = [createNode('orphan', { groupId: 'missing' })];

      expect(computeHiddenNodeIds(nodes).size).toBe(0);
    });

    it('should not loop forever on a groupId cycle', () => {
      const nodes = [createNode('a', { groupId: 'b' }), createNode('b', { groupId: 'a' })];

      expect(computeHiddenNodeIds(nodes).size).toBe(0);
    });

    it('should hide members of a cycle when one of them is raw hidden', () => {
      const nodes = [createNode('a', { groupId: 'b', hidden: true }), createNode('b', { groupId: 'a' })];

      const hidden = computeHiddenNodeIds(nodes);

      expect(hidden.has('a')).toBe(true);
      expect(hidden.has('b')).toBe(true);
    });

    it('should read template-declared hidden state from the registry', () => {
      const registry = new TemplateVisibilityRegistry();
      registry.setNodeHidden('group', true);
      const nodes = [createNode('group'), createNode('child', { groupId: 'group' })];

      const hidden = computeHiddenNodeIds(nodes, registry);

      expect(hidden).toEqual(new Set(['group', 'child']));
    });
  });

  describe('isEdgeEffectivelyHidden', () => {
    it('should be hidden when its own flag is set', () => {
      const edge = createEdge('e', 'a', 'b', { hidden: true });

      expect(isEdgeEffectivelyHidden(edge, new Set())).toBe(true);
    });

    it('should be hidden when the source node is effectively hidden', () => {
      const edge = createEdge('e', 'a', 'b');

      expect(isEdgeEffectivelyHidden(edge, new Set(['a']))).toBe(true);
    });

    it('should be hidden when the target node is effectively hidden', () => {
      const edge = createEdge('e', 'a', 'b');

      expect(isEdgeEffectivelyHidden(edge, new Set(['b']))).toBe(true);
    });

    it('should be visible when neither flag nor endpoints are hidden', () => {
      const edge = createEdge('e', 'a', 'b');

      expect(isEdgeEffectivelyHidden(edge, new Set(['c']))).toBe(false);
    });

    it('should read template-declared hidden state from the registry', () => {
      const registry = new TemplateVisibilityRegistry();
      registry.setEdgeHidden('e', true);
      const edge = createEdge('e', 'a', 'b');

      expect(isEdgeEffectivelyHidden(edge, new Set(), registry)).toBe(true);
    });
  });

  describe('raw hidden sources', () => {
    it('should combine the model flag and the registry for nodes', () => {
      const registry = new TemplateVisibilityRegistry();
      registry.setNodeHidden('b', true);

      expect(isNodeRawHidden(createNode('a', { hidden: true }), registry)).toBe(true);
      expect(isNodeRawHidden(createNode('b'), registry)).toBe(true);
      expect(isNodeRawHidden(createNode('c'), registry)).toBe(false);
    });

    it('should combine the model flag and the registry for edges', () => {
      const registry = new TemplateVisibilityRegistry();
      registry.setEdgeHidden('f', true);

      expect(isEdgeRawHidden(createEdge('e', 'a', 'b', { hidden: true }), registry)).toBe(true);
      expect(isEdgeRawHidden(createEdge('f', 'a', 'b'), registry)).toBe(true);
      expect(isEdgeRawHidden(createEdge('g', 'a', 'b'), registry)).toBe(false);
    });
  });
});
