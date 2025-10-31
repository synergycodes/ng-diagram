import { Component, computed, ElementRef, inject, viewChild } from '@angular/core';
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

  protected readonly backgroundPattern = viewChild<ElementRef<SVGPatternElement>>('backgroundPattern');

  dotSpacing = computed(() => {
    return this.flowCoreService.isInitialized() ? this.flowCoreService.provide().config.background.dotSpacing : 0;
  });
}
