import { Injectable } from '@angular/core';
import { toPng } from 'html-to-image';
import type { Options } from 'html-to-image/lib/types';
import { type Node } from 'ng-diagram';
import { calculateBoundingBox } from './generate-image.helper';

@Injectable()
export class GenerateImageService {
  private IMAGE_MARGIN: number = 50;

  async generateImageFile(nodes: Node[], element: HTMLElement) {
    const size = calculateBoundingBox(nodes, this.IMAGE_MARGIN);
    const backgroundColor = getComputedStyle(element).backgroundColor || '#fff';

    const options: Options = {
      backgroundColor,
      width: size.width,
      height: size.height,
      cacheBust: false,
      skipFonts: false,
      pixelRatio: 2,
      fetchRequestInit: { mode: 'cors' as RequestMode },
      style: {
        transform: `translate(${Math.abs(size.left)}px, ${Math.abs(size.top)}px) scale(1)`,
      },
    };

    const diagramCanvasElement = element.getElementsByTagName(
      'ng-diagram-canvas'
    )[0] as HTMLElement;

    return await toPng(diagramCanvasElement, options);
  }
}
