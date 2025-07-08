import { ChangeDetectionStrategy, Component, HostBinding, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AngularAdapterPortComponent, INodeTemplate, Node } from '@angularflow/angular-adapter';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorQuestion } from '@ng-icons/phosphor-icons/regular';

@Component({
  selector: 'app-conditional-node',
  imports: [FormsModule, AngularAdapterPortComponent, NgIcon],
  providers: [provideIcons({ phosphorQuestion })],
  templateUrl: './conditional-node.component.html',
  styleUrls: ['./conditional-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionalNodeComponent implements INodeTemplate {
  text = model<string>('');
  condition = model<string>('');
  data = input.required<Node>();

  // Computed property to check if node is selected
  readonly isSelected = computed(() => this.data().selected ?? false);

  // Host binding to apply CSS class when selected
  @HostBinding('class.node-selected') get nodeSelectedClass() {
    return this.isSelected();
  }
}
