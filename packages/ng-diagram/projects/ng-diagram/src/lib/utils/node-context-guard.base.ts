import { computed, inject } from '@angular/core';
import { NgDiagramNodeComponent } from '../components/node/ng-diagram-node.component';

/**
 * Base class that provides node component context guarding functionality.
 * Components can extend this class to prevent rendering when they're outside the node component context.
 */
export abstract class NodeContextGuardBase {
  protected nodeComponent = inject(NgDiagramNodeComponent, { optional: true });

  /**
   * Computed signal that indicates whether the component is rendered within the node component context.
   * Returns true when the node component is available.
   */
  protected readonly isRenderedOnCanvas = computed(() => !!this.nodeComponent);
}
