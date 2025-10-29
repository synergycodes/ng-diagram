import { AfterContentInit, Component, computed, ElementRef, input, viewChild } from '@angular/core';
import { DottedBackgroundComponent } from './default/dotted/dotted-background.component';
import { NgDiagramGridBackgroundComponent } from './default/grid/grid-background.component';

/**
 * The `NgDiagramBackgroundComponent` is responsible for rendering the background of the diagram.
 *
 * ## Example usage
 * ```html
 * <ng-diagram ... >
 *   <!-- Built-in backgrounds -->
 *   <ng-diagram-background type="grid" />
 *   <ng-diagram-background type="dots" />
 *   <ng-diagram-background /> <!-- Defaults to dots -->
 *
 *   <!-- Custom background via content projection -->
 *   <ng-diagram-background>
 *     <!-- Optional: custom SVG, HTML or IMAGE for background -->
 *   </ng-diagram-background>
 * </ng-diagram>
 * ```
 * @category Components
 */
@Component({
  selector: 'ng-diagram-background',
  standalone: true,
  templateUrl: './ng-diagram-background.component.html',
  styleUrls: ['./ng-diagram-background.component.scss'],
  imports: [DottedBackgroundComponent, NgDiagramGridBackgroundComponent],
})
export class NgDiagramBackgroundComponent implements AfterContentInit {
  private readonly custom = viewChild<ElementRef<HTMLElement>>('contentProjection');

  /**
   * The type of background pattern to display.
   * @default 'dots'
   */
  type = input<'grid' | 'dots'>('dots');

  protected hasContent = false;

  /** @internal */
  protected isDottedBackground = computed(() => {
    return this.type() === 'dots';
  });

  /** @internal */
  ngAfterContentInit() {
    this.hasContent = (this.custom()?.nativeElement?.childNodes?.length ?? 0) > 0;
  }
}
