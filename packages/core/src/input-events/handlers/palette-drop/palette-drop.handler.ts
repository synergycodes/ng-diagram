import { Node } from '../../../types/node.interface';
import { EventHandler } from '../event-hander';
import { PaletteDropInputEvent } from './palette-drop.event';

export class PaletteDropEventHandler extends EventHandler<PaletteDropInputEvent> {
  handle(event: PaletteDropInputEvent): void {
    const { data, lastInputPoint } = event;
    const node = data as unknown as Pick<Node, 'type' | 'data' | 'isGroup' | 'resizable'>;

    this.flow.commandHandler.emit('addNodes', {
      nodes: [
        {
          ...node,
          id: crypto.randomUUID() as string,
          position: this.flow.clientToFlowPosition({
            x: lastInputPoint.x,
            y: lastInputPoint.y,
          }),
        },
      ],
    });
  }
}
