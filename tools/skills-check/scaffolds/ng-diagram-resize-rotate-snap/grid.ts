// snippet: <ng-diagram [model]="model" [config]="gridConfig"><ng-diagram-background type="grid" /></ng-diagram>
@Component({
  selector: 'app-grid-host',
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  template: ` /* @snippet */ `,
})
export class GridHostComponent {
  readonly model = initializeModel();
  readonly gridConfig: NgDiagramConfig = {};
}
