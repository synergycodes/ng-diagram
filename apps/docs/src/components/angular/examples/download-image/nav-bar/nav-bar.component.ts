import { Component, ElementRef, inject, input } from '@angular/core';
import { NgDiagramModelService } from '@angularflow/angular-adapter';
import { downloadImage } from '../download-image.helper';
import { DownloadImageService } from '../download-image.service';

@Component({
  selector: 'nav-bar',
  template: `
    <div class="nav-bar">
      <button (click)="download()">Download</button>
    </div>
  `,
  styleUrls: ['./nav-bar-component.scss'],
})
export class NavBarComponent {
  private readonly downloadImageService = inject(DownloadImageService);
  private readonly modelService = inject(NgDiagramModelService);

  elementRef = input<ElementRef>();

  async download(): Promise<void> {
    if (this.elementRef()) {
      const file = await this.downloadImageService.download(
        this.modelService.getModel().getNodes(),
        this.elementRef()?.nativeElement
      );

      downloadImage(file, `flow-diagram-${Date.now()}.png`);
    }
  }
}
