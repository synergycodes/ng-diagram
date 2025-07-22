import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NodeTemplate, Node } from '@angularflow/angular-adapter';

@Component({
  selector: 'app-group-node',
  imports: [],
  templateUrl: './group-node.component.html',
  styleUrls: ['./group-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupNodeComponent implements NodeTemplate {
  data = input.required<Node>();
  groupTitle = computed(() => this.data().data?.['title'] ?? 'Group');
  highlighted = computed(() => this.data().highlighted ?? false);
  isPaletteNode = input<boolean>(false);
}
