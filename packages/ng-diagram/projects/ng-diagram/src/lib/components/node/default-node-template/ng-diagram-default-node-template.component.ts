import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Node } from '../../../../core/src';
import { NgDiagramNodeTemplate } from '../../../types';
import { NgDiagramBaseNodeTemplateComponent } from '../base-node-template/ng-diagram-base-node-template.component';

@Component({
  selector: 'ng-diagram-default-node-template',
  standalone: true,
  templateUrl: './ng-diagram-default-node-template.component.html',
  styleUrls: ['./ng-diagram-default-node-template.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramBaseNodeTemplateComponent],
})
export class NgDiagramDefaultNodeTemplateComponent implements NgDiagramNodeTemplate<{ label?: string }> {
  node = input.required<Node<{ label?: string }>>();

  label = computed(() => {
    const data = this.node().data;
    return 'label' in data ? data.label : this.node().id;
  });
}
