import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Node } from '@angularflow/core';
import { NgDiagramNodeSelectedDirective } from '../../../directives';
import { NgDiagramNodeTemplate } from '../../../types';
import { NgDiagramPortComponent } from '../../port/ng-diagram-port.component';
import { NgDiagramNodeResizeAdornmentComponent } from '../resize/ng-diagram-node-resize-adornment.component';
import { NgDiagramNodeRotateAdornmentComponent } from '../rotate/ng-diagram-node-rotate-adornment.component';

@Component({
  selector: 'ng-diagram-default-node-template',
  templateUrl: './ng-diagram-default-node-template.component.html',
  styleUrls: ['./ng-diagram-default-node-template.component.scss'],
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
export class NgDiagramDefaultNodeTemplateComponent implements NgDiagramNodeTemplate<{ label?: string }> {
  node = input.required<Node<{ label?: string }>>();

  label = computed(() => {
    const data = this.node().data;
    return 'label' in data ? data.label : this.node().id;
  });

  isSelected = computed(() => this.node().selected ?? false);
  classes = computed(() => `node ${this.isSelected() ? 'isSelected' : ''}`);
}
