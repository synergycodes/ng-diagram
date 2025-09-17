import '@angular/compiler';
import { Component } from '@angular/core';
import { NgDiagramContextComponent } from 'ng-diagram';
import { DownloadImageComponent } from './download-image.component';
import { GenerateImageService } from './generate-image.service';

@Component({
  selector: 'download-image-wrapper',
  imports: [NgDiagramContextComponent, DownloadImageComponent],
  template: `
    <ng-diagram-context>
      <download-image></download-image>
    </ng-diagram-context>
  `,
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
  providers: [GenerateImageService],
})
export class DownloadImageWrapperComponent {}
