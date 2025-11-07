import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  NgDiagramBaseNodeTemplateComponent,
  NgDiagramNodeSelectedDirective,
  NgDiagramNodeTemplate,
  Node,
} from 'ng-diagram';

@Component({
  selector: 'app-customized-default-node',
  templateUrl: './customized-default-node.component.html',
  styleUrls: ['./customized-default-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramBaseNodeTemplateComponent],
  hostDirectives: [{ directive: NgDiagramNodeSelectedDirective, inputs: ['node'] }],
})
export class CustomizedDefaultNodeComponent implements NgDiagramNodeTemplate {
  node = input.required<Node>();
}
