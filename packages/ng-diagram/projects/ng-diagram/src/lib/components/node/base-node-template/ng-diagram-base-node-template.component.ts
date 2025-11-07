import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Node } from '../../../../core/src';
import { NgDiagramNodeSelectedDirective } from '../../../directives';
import { NgDiagramService } from '../../../public-services/ng-diagram.service';
import { NgDiagramNodeTemplate } from '../../../types';
import { NgDiagramPortComponent } from '../../port/ng-diagram-port.component';
import { NgDiagramNodeResizeAdornmentComponent } from '../resize/ng-diagram-node-resize-adornment.component';
import { NgDiagramNodeRotateAdornmentComponent } from '../rotate/ng-diagram-node-rotate-adornment.component';

/**
 * The `NgDiagramBaseNodeTemplateComponent` provides a base template for custom nodes with default node styling and features.
 *
 * This component wraps custom node content while providing the default node's visual appearance, selection states,
 * resize and rotate adornments, and default ports. Use this as a convenient way to create custom nodes that
 * maintain the default node's look and feel while adding custom content.
 *
 * @example
 * ```html
 * <ng-diagram-base-node-template [node]="node">
 *   <!-- Custom node content here -->
 *   <div class="custom-header">{{ node().data.title }}</div>
 *   <div class="custom-body">{{ node().data.description }}</div>
 * </ng-diagram-base-node-template>
 * ```
 *
 * @category Components
 */
@Component({
  selector: 'ng-diagram-base-node-template',
  standalone: true,
  templateUrl: './ng-diagram-base-node-template.component.html',
  styleUrls: ['./ng-diagram-base-node-template.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgDiagramPortComponent,
    NgDiagramNodeSelectedDirective,
    NgDiagramNodeResizeAdornmentComponent,
    NgDiagramNodeRotateAdornmentComponent,
  ],
  host: {
    '[class.isSelected]': 'isSelected()',
    '[class.ng-diagram-port-hoverable-over-node]': 'enablePortHover()',
  },
})
export class NgDiagramBaseNodeTemplateComponent implements NgDiagramNodeTemplate {
  private readonly diagramService = inject(NgDiagramService);

  node = input.required<Node>();

  isSelected = computed(() => this.node().selected ?? false);
  classes = computed(() => `node ${this.isSelected() ? 'isSelected' : ''}`);

  // Disable port hover during resize to prevent style flickering at node edges
  enablePortHover = computed(() => !this.diagramService.actionState().resize);
}
