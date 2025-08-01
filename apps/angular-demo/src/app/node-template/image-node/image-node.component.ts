import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  AngularAdapterPortComponent,
  NgDiagramNodeTemplate,
  Node,
  NodeRotateAdornmentComponent,
  NodeSelectedDirective,
} from '@angularflow/angular-adapter';

@Component({
  selector: 'app-image-node',
  templateUrl: './image-node.component.html',
  styleUrls: ['./image-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AngularAdapterPortComponent, NodeRotateAdornmentComponent],
  hostDirectives: [{ directive: NodeSelectedDirective, inputs: ['data'] }],
  host: {
    '[class.ng-diagram-port-hoverable-over-node]': 'true',
  },
})
export class ImageNodeComponent implements NgDiagramNodeTemplate {
  data = input.required<Node>();
  imageUrl = computed(() => this.data().data?.['imageUrl'] ?? 'https://placehold.jp/150x150.png');
  isPaletteNode = input<boolean>(false);
}
