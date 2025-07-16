import { Node } from '../../../types/node.interface';
import { __NEW__NEW__BaseInputEvent } from '../../__new__input-events.interface';

export interface NodeSelectEvent extends __NEW__NEW__BaseInputEvent {
  target: Node | undefined;
}
