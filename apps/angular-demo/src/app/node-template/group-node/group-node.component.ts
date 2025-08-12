import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  GroupNode,
  NgDiagramGroupHighlightedDirective,
  NgDiagramGroupNodeTemplate,
  NgDiagramNodeResizeAdornmentComponent,
  NgDiagramNodeSelectedDirective,
} from '@angularflow/angular-adapter';

@Component({
  selector: 'app-group-node',
  imports: [NgDiagramNodeResizeAdornmentComponent, NgDiagramNodeSelectedDirective, NgDiagramGroupHighlightedDirective],
  templateUrl: './group-node.component.html',
  styleUrls: ['./group-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupNodeComponent implements NgDiagramGroupNodeTemplate<{ title: string }> {
  data = input.required<GroupNode<{ title: string }>>();
  groupTitle = computed(() => this.data().data?.title ?? 'Group');
  highlighted = computed(() => this.data().highlighted ?? false);
}
