import { computed, Directive, input } from '@angular/core';
import { Node } from '../../../core/src';

/**
 * The `NgDiagramNodeSelectedDirective` conditionally applies a selected class to a node in the diagram when it is selected.
 *
 * ## Example usage
 * ```html
 * <div ngDiagramNodeSelected [node]="node()">
 *   <!-- Node content here -->
 * </div>
 * ```
 *
 * When the node's {@link SimpleNode#selected} property is `true`, the `ng-diagram-node-selected` CSS class is applied.
 *
 * @category Directives
 */
@Directive({
  selector: '[ngDiagramNodeSelected]',
  standalone: true,
  host: {
    '[class.ng-diagram-node-selected]': 'selected()',
    '[class.ng-diagram-node-wrapper]': 'true',
  },
})
export class NgDiagramNodeSelectedDirective {
  /**
   * The node instance to monitor for selection state.
   */
  node = input.required<Node>();

  protected readonly selected = computed(() => this.node().selected ?? false);
}
