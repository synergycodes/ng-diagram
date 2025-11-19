import { Component, computed, ElementRef, inject, viewChild } from '@angular/core';
import { NgDiagramService } from '../../../../../public-api';
import { FlowCoreProviderService } from '../../../../services';
import { BackgroundPatternBase } from '../../background-pattern.base';

@Component({
  selector: 'ng-diagram-dotted-background',
  standalone: true,
  templateUrl: './dotted-background.component.html',
  styleUrl: './dotted-background.component.scss',
})
export class DottedBackgroundComponent extends BackgroundPatternBase {
  private readonly flowCoreService = inject(FlowCoreProviderService);
  private readonly diagramService = inject(NgDiagramService);

  protected readonly backgroundPattern = viewChild<ElementRef<SVGPatternElement>>('backgroundPattern');

  dotSpacing = computed(() => {
    const backgroundConfig = this.diagramService.config().background;
    return this.flowCoreService.isInitialized() && backgroundConfig ? backgroundConfig.dotSpacing : 0;
  });
}
