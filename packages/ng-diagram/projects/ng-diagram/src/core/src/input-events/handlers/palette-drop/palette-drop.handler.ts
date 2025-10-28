import { Node } from '../../../types/node.interface';
import { EventHandler } from '../event-handler';
import { PaletteDropInputEvent } from './palette-drop.event';

export class PaletteDropEventHandler extends EventHandler<PaletteDropInputEvent> {
  handle(event: PaletteDropInputEvent): void {
    const { data, lastInputPoint } = event;
    const node = data as unknown as Node;

    this.flow.commandHandler.emit('paletteDropNode', {
      node: {
        ...node,
        id: this.flow.config.computeNodeId(),
        position: this.flow.clientToFlowPosition({
          x: lastInputPoint.x,
          y: lastInputPoint.y,
        }),
      },
    });
  }
}
