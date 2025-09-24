import { AfterContentInit, Component, computed, ElementRef, inject, viewChild } from '@angular/core';
import { NgDiagramViewportService } from '../../public-services/ng-diagram-viewport.service';
import { DottedBackgroundComponent } from './default/dotted/dotted-background.component';
import { LogoBackgroundComponent } from './default/logo/logo-background.component';

/**
 * The `NgDiagramBackgroundComponent` is responsible for rendering the background of the diagram.
 *
 * ## Example usage
 * ```html
 * <ng-diagram ... >
 *   <ng-diagram-background>
 *     <!-- Optional: custom SVG, HTML or IMAGE for background -->
 *   </ng-diagram-background>
 * </ng-diagram>
 * ```
 * @category Components
 */
@Component({
  selector: 'ng-diagram-background',
  templateUrl: './ng-diagram-background.component.html',
  styleUrls: ['./ng-diagram-background.component.scss'],
  imports: [LogoBackgroundComponent, DottedBackgroundComponent],
})
export class NgDiagramBackgroundComponent implements AfterContentInit {
  private readonly custom = viewChild<ElementRef<HTMLElement>>('contentProjection');
  private readonly viewportService = inject(NgDiagramViewportService);

  readonly showLogo = computed(() => this.viewportService.scale() === 2);
  protected hasContent = false;

  /** @internal */
  ngAfterContentInit() {
    this.hasContent = (this.custom()?.nativeElement?.childNodes?.length ?? 0) > 0;
  }
}
