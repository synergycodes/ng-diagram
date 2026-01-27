import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MinimapNodeStyle, NgDiagramMinimapNodeTemplate, type Node } from 'ng-diagram';

@Component({
  selector: 'app-image-minimap-node',
  standalone: true,
  template: `<img [src]="imageUrl()" alt="image" />`,
  styleUrl: './image-minimap-node.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageMinimapNodeComponent implements NgDiagramMinimapNodeTemplate {
  node = input.required<Node>();
  nodeStyle = input<MinimapNodeStyle>();

  imageUrl = computed(() => {
    const data = this.node().data as { imageUrl?: string } | undefined;
    return data?.imageUrl ?? 'https://placehold.jp/150x150.png';
  });
}
