import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { GroupNode } from '@angularflow/core';
import { NodeSelectedDirective } from '../../../directives';
import { NgDiagramNodeTemplate } from '../../../types';
import { NodeResizeAdornmentComponent } from '../resize/node-resize-adornment.component';

@Component({
  selector: 'angular-adapter-default-group-template',
  templateUrl: './default-group-template.component.html',
  styleUrls: ['./default-group-template.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NodeResizeAdornmentComponent, NodeSelectedDirective],
})
export class DefaultGroupTemplateComponent implements NgDiagramNodeTemplate<GroupNode> {
  isPaletteNode = input<boolean>(false);
  data = input.required<GroupNode>();

  isSelected = computed(() => this.data().selected ?? false);
  highlighted = computed(() => this.data().highlighted ?? false);

  classes = computed(() => `ng-diagram-group ${this.highlighted() ? 'highlight' : ''}`);
}
