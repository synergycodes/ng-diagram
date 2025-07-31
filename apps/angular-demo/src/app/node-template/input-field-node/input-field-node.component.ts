import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AngularAdapterPortComponent,
  NgDiagramNodeTemplate,
  Node,
  NodeResizeAdornmentComponent,
  NodeRotateAdornmentComponent,
  NodeSelectedDirective,
} from '@angularflow/angular-adapter';

@Component({
  selector: 'app-input-field-node',
  imports: [FormsModule, AngularAdapterPortComponent, NodeResizeAdornmentComponent, NodeRotateAdornmentComponent],
  templateUrl: './input-field-node.component.html',
  styleUrls: ['./input-field-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: NodeSelectedDirective, inputs: ['data'] }],
})
export class InputFieldNodeComponent implements NgDiagramNodeTemplate {
  text = model<string>('');
  data = input.required<Node>();
  isPaletteNode = input<boolean>(false);
}
