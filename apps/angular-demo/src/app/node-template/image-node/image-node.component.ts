import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { INodeTemplate, Node } from '@angularflow/angular-adapter';

@Component({
  selector: 'app-image-node',
  templateUrl: './image-node.component.html',
  styleUrls: ['./image-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageNodeComponent implements INodeTemplate {
  data = input.required<Node>();
  imageUrl = computed(() => this.data().data?.['imageUrl'] ?? 'https://placehold.jp/150x150.png');
}
