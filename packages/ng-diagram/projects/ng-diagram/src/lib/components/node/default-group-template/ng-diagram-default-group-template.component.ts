import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { GroupNode } from '@ng-diagram/core';
import { NgDiagramGroupHighlightedDirective, NgDiagramNodeSelectedDirective } from '../../../directives';
import { NgDiagramGroupNodeTemplate } from '../../../types';
import { NgDiagramNodeResizeAdornmentComponent } from '../resize/ng-diagram-node-resize-adornment.component';

@Component({
  selector: 'ng-diagram-default-group-template',
  templateUrl: './ng-diagram-default-group-template.component.html',
  styleUrls: ['./ng-diagram-default-group-template.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramNodeResizeAdornmentComponent, NgDiagramNodeSelectedDirective, NgDiagramGroupHighlightedDirective],
})
export class NgDiagramDefaultGroupTemplateComponent implements NgDiagramGroupNodeTemplate {
  node = input.required<GroupNode>();

  isSelected = computed(() => this.node().selected ?? false);
  highlighted = computed(() => this.node().highlighted ?? false);

  classes = computed(() => `ng-diagram-group ${this.highlighted() ? 'highlight' : ''}`);
}
