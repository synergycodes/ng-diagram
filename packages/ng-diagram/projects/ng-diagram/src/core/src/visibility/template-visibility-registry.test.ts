import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TemplateVisibilityRegistry } from './template-visibility-registry';

describe('TemplateVisibilityRegistry', () => {
  let registry: TemplateVisibilityRegistry;

  beforeEach(() => {
    registry = new TemplateVisibilityRegistry();
  });

  it('should default everything to visible', () => {
    expect(registry.isNodeHidden('n')).toBe(false);
    expect(registry.isEdgeHidden('e')).toBe(false);
    expect(registry.isPortHidden('n', 'p')).toBe(false);
    expect(registry.isLabelHidden('e', 'l')).toBe(false);
  });

  it('should store and clear node hidden state', () => {
    registry.setNodeHidden('n', true);
    expect(registry.isNodeHidden('n')).toBe(true);

    registry.setNodeHidden('n', false);
    expect(registry.isNodeHidden('n')).toBe(false);
  });

  it('should store and clear edge hidden state', () => {
    registry.setEdgeHidden('e', true);
    expect(registry.isEdgeHidden('e')).toBe(true);

    registry.setEdgeHidden('e', false);
    expect(registry.isEdgeHidden('e')).toBe(false);
  });

  it('should store port hidden state per owner node', () => {
    registry.setPortHidden('n1', 'p', true);

    expect(registry.isPortHidden('n1', 'p')).toBe(true);
    expect(registry.isPortHidden('n2', 'p')).toBe(false);

    registry.setPortHidden('n1', 'p', false);
    expect(registry.isPortHidden('n1', 'p')).toBe(false);
  });

  it('should store label hidden state per owner edge', () => {
    registry.setLabelHidden('e1', 'l', true);

    expect(registry.isLabelHidden('e1', 'l')).toBe(true);
    expect(registry.isLabelHidden('e2', 'l')).toBe(false);
  });

  it('should notify node/edge visibility changes only when state actually changes', () => {
    const onChange = vi.fn();
    registry.onNodeOrEdgeVisibilityChange = onChange;

    registry.setNodeHidden('n', true);
    registry.setNodeHidden('n', true);
    registry.setNodeHidden('n', false);
    registry.setNodeHidden('n', false);
    registry.setEdgeHidden('e', true);

    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('should notify port/label visibility changes only when state actually changes', () => {
    const onChange = vi.fn();
    registry.onPortOrLabelVisibilityChange = onChange;

    registry.setPortHidden('n', 'p', true);
    registry.setPortHidden('n', 'p', true);
    registry.setPortHidden('n', 'p', false);
    registry.setPortHidden('n', 'p', false);
    registry.setLabelHidden('e', 'l', true);

    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('should silently drop all entries of a removed node without change callbacks', () => {
    const onChange = vi.fn();
    registry.setNodeHidden('n', true);
    registry.setPortHidden('n', 'p', true);
    registry.onNodeOrEdgeVisibilityChange = onChange;
    registry.onPortOrLabelVisibilityChange = onChange;

    registry.removeNodeEntries('n');

    expect(registry.isNodeHidden('n')).toBe(false);
    expect(registry.isPortHidden('n', 'p')).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should silently drop all entries of a removed edge without change callbacks', () => {
    const onChange = vi.fn();
    registry.setEdgeHidden('e', true);
    registry.setLabelHidden('e', 'l', true);
    registry.onNodeOrEdgeVisibilityChange = onChange;
    registry.onPortOrLabelVisibilityChange = onChange;

    registry.removeEdgeEntries('e');

    expect(registry.isEdgeHidden('e')).toBe(false);
    expect(registry.isLabelHidden('e', 'l')).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should clear all state', () => {
    registry.setNodeHidden('n', true);
    registry.setEdgeHidden('e', true);
    registry.setPortHidden('n', 'p', true);
    registry.setLabelHidden('e', 'l', true);

    registry.clear();

    expect(registry.isNodeHidden('n')).toBe(false);
    expect(registry.isEdgeHidden('e')).toBe(false);
    expect(registry.isPortHidden('n', 'p')).toBe(false);
    expect(registry.isLabelHidden('e', 'l')).toBe(false);
  });
});
