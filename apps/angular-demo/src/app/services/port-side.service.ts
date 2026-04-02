import { Injectable, signal } from '@angular/core';
import { type PortSide } from 'ng-diagram';

@Injectable({ providedIn: 'root' })
export class PortSideService {
  readonly portSide = signal<PortSide>('bottom');

  toggle(): void {
    this.portSide.update((side) => (side === 'bottom' ? 'right' : 'bottom'));
  }
}
