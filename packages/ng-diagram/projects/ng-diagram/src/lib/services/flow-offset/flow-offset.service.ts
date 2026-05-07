import { inject, Injectable } from '@angular/core';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';

@Injectable()
export class FlowOffsetService {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  private element!: HTMLElement;
  private cachedOffset: { x: number; y: number } | null = null;
  private isInteractionActive = false;

  readonly getFlowOffset = () => {
    if (this.isInteractionActive && this.cachedOffset) {
      return this.cachedOffset;
    }

    const clientRect = this.element.getBoundingClientRect();
    const offset = { x: clientRect.left, y: clientRect.top };

    if (this.isInteractionActive) {
      this.cachedOffset = offset;
    }

    return offset;
  };

  initialize(element: HTMLElement): void {
    this.element = element;
    const flowCore = this.flowCoreProvider.provide();

    flowCore.eventManager.on('actionStateChanged', (event) => {
      const { actionState } = event;
      const active = !!(
        actionState.dragging ||
        actionState.linking ||
        actionState.resize ||
        actionState.rotation ||
        actionState.panning ||
        actionState.selection
      );

      if (active && !this.isInteractionActive) {
        this.isInteractionActive = true;
      } else if (!active && this.isInteractionActive) {
        this.isInteractionActive = false;
        this.cachedOffset = null;
      }
    });
  }

  invalidateCache(): void {
    this.cachedOffset = null;
  }

  reset(): void {
    this.cachedOffset = null;
    this.isInteractionActive = false;
  }
}
