import { Component, inject } from '@angular/core';
import { FlowCoreProviderService } from '../../../../services';
import { BackgroundPatternBase } from '../../background-pattern.base';

@Component({
  selector: 'ng-diagram-dotted-background',
  templateUrl: './dotted-background.component.html',
  styleUrl: './dotted-background.component.scss',
})
export class DottedBackgroundComponent extends BackgroundPatternBase {
  private readonly flowCore = inject(FlowCoreProviderService);
  dotSize = 60;

  constructor() {
    super();

    this.dotSize = this.flowCore.provide().config.background.dotSize;
    this.setupPatternEffect();
  }
}
