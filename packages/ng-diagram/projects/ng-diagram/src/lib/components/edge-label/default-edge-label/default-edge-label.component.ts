import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgDiagramBaseEdgeComponent } from '../../../../public-api';

@Component({
  selector: 'ng-diagram-default-edge-label',
  standalone: true,
  templateUrl: './default-edge-label.component.html',
  styleUrl: './default-edge-label.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultEdgeLabelComponent {
  private readonly edgeComponent = inject(NgDiagramBaseEdgeComponent);
  readonly selected = computed(() => this.edgeComponent.selected());
}
