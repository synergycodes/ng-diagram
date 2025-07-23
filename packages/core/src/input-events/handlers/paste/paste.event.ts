import { BaseInputEvent } from '../../input-events.interface';

export interface PasteEvent extends BaseInputEvent {
  name: 'paste';
}
