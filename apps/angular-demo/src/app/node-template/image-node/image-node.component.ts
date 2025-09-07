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
export class ImageNodeComponent implements NgDiagramNodeTemplate<ImageNodeData> {
  node = input.required<Node<ImageNodeData>>();
  imageUrl = computed(() => this.node().data?.imageUrl ?? 'https://placehold.jp/150x150.png');
}

interface ImageNodeData {
  imageUrl: string;
}
