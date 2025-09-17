import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { FlowCoreProviderService } from '../../../../services';
import { BackgroundPatternBase } from '../../background-pattern.base';

@Component({
  selector: 'ng-diagram-dotted-background',
  templateUrl: './dotted-background.component.html',
  styleUrl: './dotted-background.component.scss',
})
export class DottedBackgroundComponent extends BackgroundPatternBase {
  private readonly flowCore = inject(FlowCoreProviderService);

  protected readonly backgroundPattern = viewChild<ElementRef<SVGPatternElement>>('backgroundPattern');

  dotSize = this.flowCore.provide().config.background.dotSize;
}
