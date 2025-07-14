import { NgComponentOutlet } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import {
  FlowCoreProviderService,
  NodeTemplateMap,
  PaletteInteractionService,
  PaletteNode,
} from '@angularflow/angular-adapter';

@Component({
  selector: 'app-angular-adapter-palette',
  templateUrl: './angular-adapter-palette.component.html',
  styleUrls: ['./angular-adapter-palette.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet],
})
export class AngularAdapterPaletteComponent implements AfterViewInit {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly paletteInteractionService = inject(PaletteInteractionService);
  nodeTemplateMap = input<NodeTemplateMap>(new Map());
  model = input.required<PaletteNode[]>();

  ngAfterViewInit(): void {
    const flowCore = this.flowCoreProvider.provide();
    flowCore.registerEventsHandler((event) => {
      this.paletteInteractionService.handleDropFromPalette(event);
    });
  }

  onDragStart(event: DragEvent, node: PaletteNode) {
    this.paletteInteractionService.onDragStartFromPalette(event, node);
  }
}
