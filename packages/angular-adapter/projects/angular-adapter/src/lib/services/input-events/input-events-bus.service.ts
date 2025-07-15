import { Injectable } from '@angular/core';
import { _NEW_InputEventsBus } from '@angularflow/core';

@Injectable({ providedIn: 'root' })
export class InputEventsBusService extends _NEW_InputEventsBus {
  // TODO: Remove me!
  override emit(event: any): void {
    // Custom logic for emitting events can be added here
    console.log('InputEventsBusService emit:', event);
    super.emit(event);
  }
}
