import { Edge } from '../../../types/edge.interface';
import { Node } from '../../../types/node.interface';
import { __NEW__NEW__BaseInputEvent } from '../../__new__input-events.interface';

export interface __NEW__SelectEvent extends __NEW__NEW__BaseInputEvent {
  name: 'select';
  target: Node | Edge | undefined;
  targetType: 'node' | 'edge' | 'diagram';
}
