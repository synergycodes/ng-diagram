import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AngularAdapterPortComponent,
  FlowCoreProviderService,
  Node,
  NodeSelectedDirective,
  NodeTemplate,
} from '@angularflow/angular-adapter';

@Component({
  selector: 'app-resizable-node',
  imports: [FormsModule, DecimalPipe, AngularAdapterPortComponent],
  templateUrl: './resizable-node.component.html',
  styleUrls: ['./resizable-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: NodeSelectedDirective, inputs: ['data'] }],
})
export class ResizableNodeComponent implements NodeTemplate {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  text = model<string>('');
  sizeText = model<string>('');
  data = input.required<Node>();
  autoSize = computed(() => this.data().autoSize ?? true);
  isPaletteNode = input<boolean>(false);

  setSize() {
    const [textWidth, textHeight] = this.sizeText().split(' ');
    const width = Number(textWidth);
    const height = Number(textHeight);

    if (isNaN(width) || isNaN(height)) {
      return;
    }

    this.flowCoreProvider.provide().commandHandler.emit('resizeNode', {
      id: this.data().id,
      size: { width, height },
      disableAutoSize: true,
    });
  }

  onSizeControlChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.flowCoreProvider.provide().commandHandler.emit('updateNode', {
      id: this.data().id,
      nodeChanges: {
        autoSize: checked,
      },
    });

    if (!checked) {
      this.setSize();
    }
  }
}
