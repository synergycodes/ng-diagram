/**
 * Registry for template-declared hidden state.
 *
 * Ports and edge labels are declared in templates, not in the model, so their
 * `hidden` inputs (and the template-level hidden bindings for nodes and edges)
 * cannot live on model objects. The rendering layer writes the declared state
 * here; core reads it as one of the raw sources feeding effective-visibility
 * computation. Everything downstream reads effective visibility
 * (`computedHidden` on nodes/edges, `isPortHidden`/`isLabelHidden` for
 * template-owned items) — never raw flags.
 *
 * Absence means visible: entries exist only for currently hidden items.
 *
 * @internal
 */
export class TemplateVisibilityRegistry {
  private readonly hiddenNodes = new Set<string>();
  private readonly hiddenEdges = new Set<string>();
  /** nodeId -> hidden port ids */
  private readonly hiddenPorts = new Map<string, Set<string>>();
  /** edgeId -> hidden label ids */
  private readonly hiddenLabels = new Map<string, Set<string>>();

  /**
   * Invoked when the hidden state of a node or edge changes.
   * Wired by FlowCore to re-run effective-visibility computation.
   * Port/label changes do not trigger it — their hidden state is read live
   * at each consumer and never stamped on the model.
   */
  onNodeOrEdgeVisibilityChange?: () => void;

  /**
   * Invoked when the hidden state of a port or edge label changes.
   * Wired by FlowCore to prune initialization measurement expectations —
   * post-init, port/label hidden state is read live and needs no state pass.
   */
  onPortOrLabelVisibilityChange?: () => void;

  setNodeHidden(nodeId: string, hidden: boolean): void {
    if (this.setFlag(this.hiddenNodes, nodeId, hidden)) {
      this.onNodeOrEdgeVisibilityChange?.();
    }
  }

  setEdgeHidden(edgeId: string, hidden: boolean): void {
    if (this.setFlag(this.hiddenEdges, edgeId, hidden)) {
      this.onNodeOrEdgeVisibilityChange?.();
    }
  }

  setPortHidden(nodeId: string, portId: string, hidden: boolean): void {
    if (this.setNestedFlag(this.hiddenPorts, nodeId, portId, hidden)) {
      this.onPortOrLabelVisibilityChange?.();
    }
  }

  setLabelHidden(edgeId: string, labelId: string, hidden: boolean): void {
    if (this.setNestedFlag(this.hiddenLabels, edgeId, labelId, hidden)) {
      this.onPortOrLabelVisibilityChange?.();
    }
  }

  isNodeHidden(nodeId: string): boolean {
    return this.hiddenNodes.has(nodeId);
  }

  isEdgeHidden(edgeId: string): boolean {
    return this.hiddenEdges.has(edgeId);
  }

  isPortHidden(nodeId: string, portId: string): boolean {
    return this.hiddenPorts.get(nodeId)?.has(portId) ?? false;
  }

  isLabelHidden(edgeId: string, labelId: string): boolean {
    return this.hiddenLabels.get(edgeId)?.has(labelId) ?? false;
  }

  clear(): void {
    this.hiddenNodes.clear();
    this.hiddenEdges.clear();
    this.hiddenPorts.clear();
    this.hiddenLabels.clear();
  }

  /** @returns true when the stored state actually changed */
  private setFlag(set: Set<string>, id: string, hidden: boolean): boolean {
    if (hidden) {
      if (set.has(id)) return false;
      set.add(id);
      return true;
    }
    return set.delete(id);
  }

  /** @returns true when the stored state actually changed */
  private setNestedFlag(map: Map<string, Set<string>>, ownerId: string, itemId: string, hidden: boolean): boolean {
    if (hidden) {
      const items = map.get(ownerId) ?? new Set<string>();
      if (items.has(itemId)) return false;
      items.add(itemId);
      map.set(ownerId, items);
      return true;
    }
    const items = map.get(ownerId);
    if (!items?.delete(itemId)) return false;
    if (items.size === 0) {
      map.delete(ownerId);
    }
    return true;
  }
}
