import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FlowCoreProviderService, INodeTemplate, Node } from '@angularflow/angular-adapter';

@Component({
  selector: 'app-resizable-node',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './resizable-node.component.html',
  styleUrls: ['./resizable-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResizableNodeComponent implements INodeTemplate {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  text = model<string>('');
  sizeText = model<string>('');
  data = input.required<Node>();
  sizeControlled = input.required<Node['sizeControlled']>();

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
    });
  }

  onSizeControlChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.flowCoreProvider.provide().commandHandler.emit('controlNodeSize', {
      id: this.data().id,
      sizeControlled: checked,
    });

    if (checked) {
      this.setSize();
    }
  }
}
