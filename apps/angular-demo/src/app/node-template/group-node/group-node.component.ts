import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  GroupNode,
  NgDiagramGroupHighlightedDirective,
  NgDiagramGroupNodeTemplate,
  NgDiagramNodeResizeAdornmentComponent,
  NgDiagramNodeSelectedDirective,
} from 'ng-diagram';

@Component({
  selector: 'app-group-node',
  imports: [NgDiagramNodeResizeAdornmentComponent, NgDiagramNodeSelectedDirective, NgDiagramGroupHighlightedDirective],
  templateUrl: './group-node.component.html',
  styleUrls: ['./group-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupNodeComponent implements NgDiagramGroupNodeTemplate<{ title: string }> {
  node = input.required<GroupNode<{ title: string }>>();
  groupTitle = computed(() => this.node().data?.title ?? 'Group');
  highlighted = computed(() => this.node().highlighted ?? false);
}
