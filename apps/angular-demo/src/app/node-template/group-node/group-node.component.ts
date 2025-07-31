import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  NgDiagramNodeTemplate,
  NodeResizeAdornmentComponent,
  NodeSelectedDirective,
} from '@angularflow/angular-adapter';
import { GroupNode } from '@angularflow/core';

@Component({
  selector: 'app-group-node',
  imports: [NodeResizeAdornmentComponent, NodeSelectedDirective],
  templateUrl: './group-node.component.html',
  styleUrls: ['./group-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupNodeComponent implements NgDiagramNodeTemplate<GroupNode> {
  data = input.required<GroupNode>();
  groupTitle = computed(() => this.data().data?.['title'] ?? 'Group');
  highlighted = computed(() => this.data().highlighted ?? false);
  isPaletteNode = input<boolean>(false);
}
