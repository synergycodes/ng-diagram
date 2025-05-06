import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Edge } from '@angularflow/core';
import { getStraightPath } from '../../../utils/edge/get-paths';

@Component({
  selector: 'angular-adapter-edge-straight',
  templateUrl: './edge-straight.component.html',
  styleUrl: './edge-straight.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EdgeStraightComponent {
  edge = input.required<Edge>();

  get path(): string {
    return getStraightPath(this.edge().points || []);
  }
}
