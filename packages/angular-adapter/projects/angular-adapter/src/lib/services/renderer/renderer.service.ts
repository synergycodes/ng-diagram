import { Injectable } from '@angular/core';
import { Renderer } from '@angularflow/core';

@Injectable({ providedIn: 'root' })
export class RendererService implements Renderer {
  draw(): void {
    // do nothing for now
  }
}
