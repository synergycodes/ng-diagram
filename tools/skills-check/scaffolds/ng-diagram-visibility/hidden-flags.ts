// snippet: <ng-diagram-port id="out" type="source" side="right" [hidden]="!editMode()" />
@Component({
  selector: 'app-visibility-host',
  imports: [NgDiagramPortComponent, NgDiagramBaseEdgeLabelComponent],
  template: ` /* @snippet */ `,
})
export class VisibilityHostComponent {
  readonly editMode = signal(true);
  readonly showLabels = signal(true);
}
