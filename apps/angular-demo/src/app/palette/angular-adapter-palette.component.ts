import { AfterViewInit, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import {
  FlowCoreProviderService,
  NodeTemplateMap,
  PaletteInteractionService,
  PaletteNode,
} from '@angularflow/angular-adapter';
import { NodePreviewComponent } from './node-preview/node-preview.component';

@Component({
  selector: 'app-angular-adapter-palette',
  templateUrl: './angular-adapter-palette.component.html',
  styleUrls: ['./angular-adapter-palette.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NodePreviewComponent],
})
export class AngularAdapterPaletteComponent implements AfterViewInit {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly paletteInteractionService = inject(PaletteInteractionService);
  nodeTemplateMap = input<NodeTemplateMap>(new Map());
  model = input.required<PaletteNode[]>();

  ngAfterViewInit(): void {
    const flowCore = this.flowCoreProvider.provide();
    flowCore.registerEventsHandler((event) => {
      if (event.type === 'drop') {
        this.paletteInteractionService.handleDropFromPalette(event);
      }
    });
  }
}
