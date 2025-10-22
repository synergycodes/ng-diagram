// @collapse-start
import { Component, ElementRef, inject, input } from '@angular/core';
import { NgDiagramModelService } from 'ng-diagram';
import { downloadImage } from '../generate-image.helper';
import { GenerateImageService } from '../generate-image.service';
// @collapse-end

@Component({
  selector: 'nav-bar',
  template: `
    <div class="nav-bar">
      <button class="btn" (click)="download()">Download</button>
    </div>
  `,
  styleUrls: ['./nav-bar.component.scss'],
})
export class NavBarComponent {
  private readonly generateImageService = inject(GenerateImageService);
  private readonly modelService = inject(NgDiagramModelService);

  diagramRef = input<ElementRef<HTMLElement> | undefined>();

  // @mark-start
  async download(): Promise<void> {
    const diagramRef = this.diagramRef();
    if (diagramRef) {
      const file = await this.generateImageService.generateImageFile(
        this.modelService.getModel().getNodes(),
        diagramRef.nativeElement
      );

      downloadImage(file, `flow-diagram-${Date.now()}.png`);
    }
  }
  // @mark-end
}
