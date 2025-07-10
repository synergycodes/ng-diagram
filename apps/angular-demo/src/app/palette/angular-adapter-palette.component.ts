import { NgComponentOutlet } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { FlowCoreProviderService, Node, NodeTemplateMap } from '@angularflow/angular-adapter';

@Component({
  selector: 'app-angular-adapter-palette',
  templateUrl: './angular-adapter-palette.component.html',
  styleUrls: ['./angular-adapter-palette.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet],
})
export class AngularAdapterPaletteComponent implements AfterViewInit {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  nodeTemplateMap = input<NodeTemplateMap>(new Map());
  model = input.required<Node[]>();
  private offset = { x: 0, y: 0 };

  ngAfterViewInit(): void {
    const flowCore = this.flowCoreProvider.provide();
    flowCore.registerEventsHandler((event) => {
      if (event.type === 'drop') {
        const { data, clientPosition } = event;
        flowCore.commandHandler.emit('addNodes', {
          nodes: [
            {
              ...data,
              id: crypto.randomUUID(),
              position: flowCore.clientToFlowPosition({
                x: clientPosition.x - this.offset.x,
                y: clientPosition.y - this.offset.y,
              }),
            },
          ] as Node[],
        });
      }
    });
  }

  onDragStart(event: DragEvent, node: Node) {
    this.offset = { x: event.offsetX, y: event.offsetY };
    event.dataTransfer?.setData('text/plain', JSON.stringify(node));
  }
}
