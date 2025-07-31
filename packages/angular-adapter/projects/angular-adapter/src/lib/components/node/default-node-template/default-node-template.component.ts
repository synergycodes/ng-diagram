import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Node, SimpleNode } from '@angularflow/core';
import { NodeSelectedDirective } from '../../../directives';
import { NodeTemplate } from '../../../types';
import { AngularAdapterPortComponent } from '../../port/angular-adapter-port.component';
import { NodeResizeAdornmentComponent } from '../resize/node-resize-adornment.component';
import { NodeRotateAdornmentComponent } from '../rotate/node-rotate-adornment.component';

@Component({
  selector: 'angular-adapter-default-node-template',
  templateUrl: './default-node-template.component.html',
  styleUrls: ['./default-node-template.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AngularAdapterPortComponent,
    NodeSelectedDirective,
    NodeResizeAdornmentComponent,
    NodeRotateAdornmentComponent,
  ],
  host: {
    '[class.isSelected]': 'isSelected()',
    '[class.ng-diagram-port-hoverable-over-node]': 'true',
  },
})
export class DefaultNodeTemplateComponent implements NodeTemplate<SimpleNode> {
  data = input.required<Node>();
  isPaletteNode = input<boolean>(false);

  label = computed(() => this.data().data['label'] || this.data().id);
  isSelected = computed(() => this.data().selected ?? false);
  classes = computed(() => `ng-diagram-node-wrapper node ${this.isSelected() ? 'isSelected' : ''}`);
}
