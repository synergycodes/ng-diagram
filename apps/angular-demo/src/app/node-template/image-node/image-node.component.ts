import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  NgDiagramNodeRotateAdornmentComponent,
  NgDiagramNodeSelectedDirective,
  NgDiagramNodeTemplate,
  NgDiagramPortComponent,
  Node,
} from '@angularflow/angular-adapter';

@Component({
  selector: 'app-image-node',
  templateUrl: './image-node.component.html',
  styleUrls: ['./image-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramPortComponent, NgDiagramNodeRotateAdornmentComponent],
  hostDirectives: [{ directive: NgDiagramNodeSelectedDirective, inputs: ['node'] }],
  host: {
    '[class.ng-diagram-port-hoverable-over-node]': 'true',
  },
})
export class ImageNodeComponent implements NgDiagramNodeTemplate {
  node = input.required<Node>();
  imageUrl = computed(() => this.node().data?.['imageUrl'] ?? 'https://placehold.jp/150x150.png');
}
