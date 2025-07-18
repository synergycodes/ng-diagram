import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  NgDiagramPaletteDirective,
  NgDiagramPaletteItemComponent,
  NgDiagramPaletteItemPreviewComponent,
  PaletteNode,
} from '@angularflow/angular-adapter';
import { NodePreviewComponent } from './node-preview/node-preview.component';

@Component({
  selector: 'app-palette',
  templateUrl: './palette.component.html',
  styleUrls: ['./palette.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NodePreviewComponent,
    NodePreviewComponent,
    NgDiagramPaletteItemComponent,
    NgDiagramPaletteItemPreviewComponent,
    NgDiagramPaletteDirective,
  ],
})
export class PaletteComponent {
  model = input.required<PaletteNode[]>();
}
