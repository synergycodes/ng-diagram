import { EventHandler } from '../event-hander';
import { CutInputEvent } from './cut.event';

export class CutEventHandler extends EventHandler<CutInputEvent> {
  handle(): void {
    this.flow.commandHandler.emit('cut');
  }
}
