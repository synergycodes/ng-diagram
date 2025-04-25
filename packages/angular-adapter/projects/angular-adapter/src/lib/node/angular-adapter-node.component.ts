import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NodePositionDirective } from '../directives';

@Component({
  selector: 'angular-adapter-node',
  templateUrl: './angular-adapter-node.component.html',
  styleUrl: './angular-adapter-node.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: NodePositionDirective,
      inputs: ['position'],
    },
  ],
})
export class AngularAdapterNodeComponent {}
