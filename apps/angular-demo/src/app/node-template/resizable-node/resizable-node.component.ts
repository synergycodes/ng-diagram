import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NgDiagramModelService,
  NgDiagramNodeResizeAdornmentComponent,
  NgDiagramNodeSelectedDirective,
  NgDiagramNodeTemplate,
  NgDiagramPortComponent,
  NgDiagramService,
  Node,
} from '@angularflow/angular-adapter';

@Component({
  selector: 'app-resizable-node',
  imports: [FormsModule, DecimalPipe, NgDiagramPortComponent, NgDiagramNodeResizeAdornmentComponent],
  templateUrl: './resizable-node.component.html',
  styleUrls: ['./resizable-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: NgDiagramNodeSelectedDirective, inputs: ['node'] }],
  host: {
    '[class.ng-diagram-port-hoverable]': 'true',
  },
})
export class ResizableNodeComponent implements NgDiagramNodeTemplate<{ text: string }> {
  private readonly diagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);

  text = computed(() => this.node()?.data?.text || '');
  sizeText = model<string>('');
  node = input.required<Node<{ text: string }>>();
  autoSize = computed(() => this.node().autoSize ?? true);

  updateText(event: Event) {
    this.modelService.updateNodeData<{ text: string }>(this.node().id, {
      text: (event.target as HTMLInputElement).value,
    });
  }

  setSize() {
    const [textWidth, textHeight] = this.sizeText().split(' ');
    const width = Number(textWidth);
    const height = Number(textHeight);

    if (isNaN(width) || isNaN(height)) {
      return;
    }

    this.diagramService.getCommandHandler()?.emit('resizeNode', {
      id: this.node().id,
      size: { width, height },
      disableAutoSize: true,
      position: this.node().position,
    });
  }

  onSizeControlChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.diagramService.getCommandHandler()?.emit('updateNode', {
      id: this.node().id,
      nodeChanges: {
        autoSize: checked,
      },
    });

    if (!checked) {
      this.setSize();
    }
  }
}
