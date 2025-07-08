import { ChangeDetectionStrategy, Component, HostBinding, computed, input } from '@angular/core';
import { INodeTemplate, Node } from '@angularflow/angular-adapter';

@Component({
  selector: 'app-group-node',
  imports: [],
  templateUrl: './group-node.component.html',
  styleUrls: ['./group-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupNodeComponent implements INodeTemplate {
  data = input.required<Node>();
  groupTitle = computed(() => this.data().data?.['title'] ?? 'Group');
  highlighted = computed(() => this.data().highlighted ?? false);

  // Computed property to check if node is selected
  readonly isSelected = computed(() => this.data().selected ?? false);

  // Host binding to apply CSS class when selected
  @HostBinding('class.node-selected') get nodeSelectedClass() {
    return this.isSelected();
  }
}
