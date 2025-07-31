import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AngularAdapterPortComponent,
  Node,
  NodeResizeAdornmentComponent,
  NodeRotateAdornmentComponent,
  NodeSelectedDirective,
  NodeTemplate,
} from '@angularflow/angular-adapter';

@Component({
  selector: 'app-input-field-node',
  imports: [FormsModule, AngularAdapterPortComponent, NodeResizeAdornmentComponent, NodeRotateAdornmentComponent],
  templateUrl: './input-field-node.component.html',
  styleUrls: ['./input-field-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: NodeSelectedDirective, inputs: ['data'] }],
  host: {
    '[class.ng-diagram-node-wrapper]': 'true',
  },
})
export class InputFieldNodeComponent implements NodeTemplate {
  text = model<string>('');
  data = input.required<Node>();
  isPaletteNode = input<boolean>(false);
}
