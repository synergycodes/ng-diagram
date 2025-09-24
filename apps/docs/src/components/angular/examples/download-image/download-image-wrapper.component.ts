import '@angular/compiler';
import { Component } from '@angular/core';
import { provideNgDiagram } from 'ng-diagram';
import { DownloadImageComponent } from './download-image.component';
import { GenerateImageService } from './generate-image.service';

@Component({
  selector: 'download-image-wrapper',
  imports: [DownloadImageComponent],
  template: ` <download-image></download-image> `,
  styles: [
    `
      :host {
        flex: 1;
        display: flex;
        position: relative;
        flex-direction: column;
      }
    `,
  ],
  providers: [GenerateImageService, provideNgDiagram()],
})
export class DownloadImageWrapperComponent {}
