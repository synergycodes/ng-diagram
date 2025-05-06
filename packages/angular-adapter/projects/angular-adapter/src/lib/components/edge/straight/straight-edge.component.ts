import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Edge } from '@angularflow/core';
import { getStraightPath } from '../../../utils/edge/get-paths';

@Component({
  selector: 'angular-adapter-straight-edge',
  templateUrl: './straight-edge.component.html',
  styleUrl: './straight-edge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StraightEdgeComponent {
  edge = input.required<Edge>();

  get path(): string {
    return getStraightPath(this.edge().points || []);
  }
}
