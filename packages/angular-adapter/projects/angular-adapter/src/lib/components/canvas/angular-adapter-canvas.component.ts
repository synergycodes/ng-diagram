import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'angular-adapter-canvas',
  templateUrl: './angular-adapter-canvas.component.html',
  styleUrl: './angular-adapter-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AngularAdapterCanvasComponent {}
