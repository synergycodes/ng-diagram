import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Node } from '@angularflow/core';
import { NodeSelectedDirective } from '../../../directives';
import { NodeTemplate } from '../../../types';
import { NodeResizeAdornmentComponent } from '../resize/node-resize-adornment.component';

@Component({
  selector: 'angular-adapter-default-group-template',
  templateUrl: './default-group-template.component.html',
  styleUrls: ['./default-group-template.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NodeResizeAdornmentComponent, NodeSelectedDirective],
})
export class DefaultGroupTemplateComponent implements NodeTemplate {
  isPaletteNode = input<boolean>(false);
  data = input.required<Node>();

  isSelected = computed(() => this.data().selected ?? false);
  highlighted = computed(() => this.data().highlighted ?? false);

  classes = computed(() => `ng-diagram-group ${this.highlighted() ? 'highlight' : ''}`);
}
