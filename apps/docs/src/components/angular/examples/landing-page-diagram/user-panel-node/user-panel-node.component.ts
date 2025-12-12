import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import {
  NgDiagramNodeSelectedDirective,
  type NgDiagramNodeTemplate,
  NgDiagramPortComponent,
  type Node,
} from 'ng-diagram';

export interface UserPanelData {
  users: { id: number; name: string; avatar: string; color: string }[];
}

@Component({
  selector: 'app-user-panel-node',
  imports: [
    NgDiagramPortComponent,
    NgDiagramNodeSelectedDirective,
    CommonModule,
  ],
  templateUrl: './user-panel-node.component.html',
  styleUrls: ['./user-panel-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ng-diagram-port-hoverable-over-node]': 'true',
  },
})
export class UserPanelNodeComponent
  implements NgDiagramNodeTemplate<UserPanelData>
{
  selectedUser = signal(2);

  node = input.required<Node<UserPanelData>>();
  users = computed(() => this.node()?.data?.users || []);

  selectUser(id: number) {
    this.selectedUser.set(id);
  }
}
