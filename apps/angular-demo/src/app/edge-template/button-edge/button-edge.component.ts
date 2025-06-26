import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IEdgeTemplate } from '@angularflow/angular-adapter';
import { Edge } from '@angularflow/angular-adapter';

@Component({
  selector: 'app-button-edge',
  imports: [],
  templateUrl: './button-edge.component.html',
  styleUrls: ['./button-edge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonEdgeComponent implements IEdgeTemplate {
  data = input.required<Edge>();
  // groupTitle = computed(() => this.data().data?.['title'] ?? 'Group');
  // highlighted = computed(() => this.data().highlighted ?? false);
}
