import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  ViewChild,
} from '@angular/core';
import {
  FlowCoreProviderService,
  NodeTemplateMap,
  PaletteInteractionService,
  PaletteNode,
} from '@angularflow/angular-adapter';
import { NodePreviewComponent } from './node-preview/node-preview.component';

@Component({
  selector: 'app-angular-adapter-palette',
  templateUrl: './angular-adapter-palette.component.html',
  styleUrls: ['./angular-adapter-palette.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NodePreviewComponent, NodePreviewComponent],
  standalone: true,
})
export class AngularAdapterPaletteComponent implements AfterViewInit {
  private readonly flowCoreProviderService = inject(FlowCoreProviderService);
  private readonly paletteInteractionService = inject(PaletteInteractionService);
  nodeTemplateMap = input<NodeTemplateMap>(new Map());
  model = input.required<PaletteNode[]>();
  scale = computed(() => this.flowCoreProviderService.provide().getScale());
  draggedNode = computed(() => this.paletteInteractionService.draggedNode() as PaletteNode);

  @ViewChild('ghostNodeRef') ghostNodeRef!: ElementRef<HTMLElement>;

  handleOnDragStart(event: DragEvent, node: PaletteNode) {
    if (this.ghostNodeRef && this.ghostNodeRef?.nativeElement) {
      event.dataTransfer?.setDragImage(this.ghostNodeRef.nativeElement, 0, 0);
    }
    this.paletteInteractionService.onDragStartFromPalette(event, node);
  }

  handleOnMouseDown(node: PaletteNode) {
    this.paletteInteractionService.onMouseDown(node);
  }

  ngAfterViewInit(): void {
    const flowCore = this.flowCoreProviderService.provide();
    flowCore.registerEventsHandler((event) => {
      if (event.type === 'drop') {
        this.paletteInteractionService.handleDropFromPalette(event);
      }
    });
  }
}
