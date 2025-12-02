import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  type GroupNode,
  NgDiagramGroupHighlightedDirective,
  type NgDiagramGroupNodeTemplate,
  NgDiagramNodeResizeAdornmentComponent,
  NgDiagramNodeSelectedDirective,
  NgDiagramPortComponent,
} from 'ng-diagram';

export interface GroupNodeData {
  title: string;
}

@Component({
  selector: 'app-group-node',
  imports: [
    NgDiagramPortComponent,
    NgDiagramNodeSelectedDirective,
    NgDiagramGroupHighlightedDirective,
    CommonModule,
    NgDiagramNodeResizeAdornmentComponent,
  ],
  templateUrl: './group-node.component.html',
  styleUrls: ['./group-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ng-diagram-port-hoverable]': 'true',
  },
})
export class GroupNodeComponent
  implements NgDiagramGroupNodeTemplate<GroupNodeData>
{
  node = input.required<GroupNode<GroupNodeData>>();
  title = computed(() => this.node()?.data?.title || 'Group');
}
