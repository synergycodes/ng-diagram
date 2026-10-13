// snippet: <div class="lane" ngDiagramGroupHighlighted ngDiagramNodeSelected [node]="node()">
@Component({
  selector: 'app-lane-group',
  imports: [NgDiagramNodeResizeAdornmentComponent, NgDiagramGroupHighlightedDirective, NgDiagramNodeSelectedDirective],
  template: ` /* @snippet */ `,
})
export class LaneGroupComponent {
  readonly node = input.required<GroupNode<{ title: string }>>();
}
