import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { GroupNode } from '@angularflow/core';
import { NgDiagramNodeSelectedDirective } from '../../../directives';
import { NgDiagramNodeTemplate } from '../../../types';
import { NgDiagramNodeResizeAdornmentComponent } from '../resize/ng-diagram-node-resize-adornment.component';

@Component({
  selector: 'ng-diagram-default-group-template',
  templateUrl: './ng-diagram-default-group-template.component.html',
  styleUrls: ['./ng-diagram-default-group-template.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramNodeResizeAdornmentComponent, NgDiagramNodeSelectedDirective],
})
export class NgDiagramDefaultGroupTemplateComponent implements NgDiagramNodeTemplate<GroupNode> {
  isPaletteNode = input<boolean>(false);
  data = input.required<GroupNode>();

  isSelected = computed(() => this.data().selected ?? false);
  highlighted = computed(() => this.data().highlighted ?? false);

  classes = computed(() => `ng-diagram-group ${this.highlighted() ? 'highlight' : ''}`);
}
