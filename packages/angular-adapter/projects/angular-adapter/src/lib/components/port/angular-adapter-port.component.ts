import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Port } from '@angularflow/core';
import { PointerDownEventListenerDirective, PointerUpEventListenerDirective } from '../../directives';

@Component({
  selector: 'angular-adapter-port',
  templateUrl: './angular-adapter-port.component.html',
  styleUrl: './angular-adapter-port.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: PointerDownEventListenerDirective,
      inputs: ['eventTarget'],
    },
    {
      directive: PointerUpEventListenerDirective,
      inputs: ['eventTarget'],
    },
  ],
})
export class AngularAdapterPortComponent {
  @Input() id!: string;
  @Input() type!: Port['type'];
}
