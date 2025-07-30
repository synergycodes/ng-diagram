import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { GroupNode } from '@angularflow/core';
import { NodeSelectedDirective } from '../../../directives';
import { NodeHighlightedDirective } from '../../../directives/node-highlighted/node-highlighted.directive';
import { NodeTemplate } from '../../../types';
import { NodeResizeAdornmentComponent } from '../resize/node-resize-adornment.component';

@Component({
  selector: 'angular-adapter-default-group-template',
  templateUrl: './default-group-template.component.html',
  styleUrls: ['./default-group-template.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NodeResizeAdornmentComponent, NodeSelectedDirective, NodeHighlightedDirective],
})
export class DefaultGroupTemplateComponent implements NodeTemplate<GroupNode> {
  isPaletteNode = input<boolean>(false);
  data = input.required<GroupNode>();

  isSelected = computed(() => this.data().selected ?? false);
  highlighted = computed(() => this.data().highlighted ?? false);

  classes = computed(() => `ng-diagram-group ${this.highlighted() ? 'highlight' : ''}`);
}
