import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AngularAdapterPortComponent, INodeTemplate, Node } from '@angularflow/angular-adapter';

@Component({
  selector: 'app-input-field-node',
  imports: [FormsModule, AngularAdapterPortComponent],
  templateUrl: './input-field-node.component.html',
  styleUrls: ['./input-field-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputFieldNodeComponent implements INodeTemplate {
  text = model<string>('');
  data = input.required<Node>();
}
