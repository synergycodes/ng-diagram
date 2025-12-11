import { computed, Directive, input } from '@angular/core';
import { GroupNode } from '../../../core/src';

/**
 * The `NgDiagramGroupHighlightedDirective` conditionally applies a highlight class to a group node in the diagram when it is highlighted.
 *
 * ## Example usage
 * ```html
 * <div ngDiagramGroupHighlighted [node]="node">
 *   <!-- Group node content here -->
 * </div>
 * ```
 *
 * When the group's {@link GroupNode#highlighted} property is `true`, the `ng-diagram-group-highlight` CSS class is applied.
 *
 * @public
 * @since 0.8.0
 * @category Directives
 */
@Directive({
  selector: '[ngDiagramGroupHighlighted]',
  standalone: true,
  host: {
    '[class.ng-diagram-group-highlight]': 'highlighted()',
    '[class.ng-diagram-node-wrapper]': 'true',
  },
})
export class NgDiagramGroupHighlightedDirective {
  /**
   * The group node instance to monitor for highlight state.
   */
  node = input.required<GroupNode>();

  protected readonly highlighted = computed(() => {
    return this.node().highlighted ?? false;
  });
}
