import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  NgDiagramNodeSelectedDirective,
  type NgDiagramNodeTemplate,
  NgDiagramPortComponent,
  type Node,
} from 'ng-diagram';

export interface WorkflowNodeData {
  title: string;
  subtitle?: string;
  icon: string;
  iconColor?: string;
}

@Component({
  selector: 'app-workflow-node',
  imports: [
    NgDiagramPortComponent,
    NgDiagramNodeSelectedDirective,
    CommonModule,
  ],
  templateUrl: './workflow-node.component.html',
  styleUrls: ['./workflow-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ng-diagram-port-hoverable-over-node]': 'true',
  },
})
export class WorkflowNodeComponent
  implements NgDiagramNodeTemplate<WorkflowNodeData>
{
  node = input.required<Node<WorkflowNodeData>>();

  className = computed(() => `ph ph-${this.node().data.icon}`);
  title = computed(() => this.node()?.data?.title || '');
  subtitle = computed(() => this.node()?.data?.subtitle || '');
  icon = computed(() => this.node()?.data?.icon || '');
  iconColor = computed(() => this.node()?.data?.iconColor || 'gray');
}
