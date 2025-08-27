import '@angular/compiler';
import { Component } from '@angular/core';
import { NgDiagramContextComponent } from '@angularflow/angular-adapter';
import { DownloadImageComponent } from './download-image.component';
import { DownloadImageService } from './download-image.service';

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
  providers: [DownloadImageService],
})
export class DownloadImageWrapperComponent {}
