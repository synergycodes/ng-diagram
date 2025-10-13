import { Injectable, inject } from '@angular/core';
import { InputEventsRouter } from '../../../core/src';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';

type DomEvent = KeyboardEvent | WheelEvent | PointerEvent | DragEvent | TouchEvent;

@Injectable()
export class InputEventsRouterService extends InputEventsRouter {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  protected get environment() {
    return this.flowCoreProvider.provide().getEnvironment();
  }

  get eventHelpers() {
    return this.environment.eventHelpers;
  }

  getBaseEvent(event: DomEvent) {
    return {
      modifiers: this.eventHelpers.getModifiers(event),
      id: this.environment.generateId(),
      timestamp: this.environment.now(),
    };
  }
}
