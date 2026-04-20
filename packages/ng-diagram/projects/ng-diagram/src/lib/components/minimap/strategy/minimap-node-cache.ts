import { Node } from '../../../../core/src';
import { MinimapNodeData } from '../ng-diagram-minimap.types';

/**
 * WeakMap-based cache for MinimapNodeData, keyed by Node object reference.
 *
 * When a node hasn't been modified, the engine preserves its object reference.
 * This cache exploits that: unchanged nodes return the same MinimapNodeData,
 * so Angular's `@for` with `track` skips their DOM updates.
 *
 * Stale entries are garbage-collected automatically when Node references
 * are no longer held by the diagram engine.
 *
 * @internal
 */
export class MinimapNodeCache {
  private cache = new WeakMap<Node, MinimapNodeData>();

  clear(): void {
    this.cache = new WeakMap();
  }

  getOrCompute(node: Node, compute: () => MinimapNodeData): MinimapNodeData {
    const cached = this.cache.get(node);
    if (cached) {
      return cached;
    }

    const data = compute();
    this.cache.set(node, data);
    return data;
  }
}
