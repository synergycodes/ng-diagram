import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Node } from '../../../../core/src';
import { NgDiagramNodeSelectedDirective } from '../../../directives';
import { NgDiagramService } from '../../../public-services/ng-diagram.service';
import { NgDiagramNodeTemplate } from '../../../types';
import { NgDiagramPortComponent } from '../../port/ng-diagram-port.component';
import { NgDiagramNodeResizeAdornmentComponent } from '../resize/ng-diagram-node-resize-adornment.component';
import { NgDiagramNodeRotateAdornmentComponent } from '../rotate/ng-diagram-node-rotate-adornment.component';

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
