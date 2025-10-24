import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Node } from '../../../../core/src';
import { NgDiagramNodeSelectedDirective } from '../../../directives';
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
    '[class.ng-diagram-port-hoverable-over-node]': 'true',
  },
})
export class NgDiagramBaseNodeTemplateComponent implements NgDiagramNodeTemplate {
  node = input.required<Node>();

  isSelected = computed(() => this.node().selected ?? false);
  classes = computed(() => `node ${this.isSelected() ? 'isSelected' : ''}`);
}
