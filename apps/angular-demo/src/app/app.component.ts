import { ChangeDetectionStrategy, Component, signal, Type } from '@angular/core';
import { AngularAdapterDiagramComponent, INodeTemplate, NodeTemplateMap } from '@angularflow/angular-adapter';
import { SignalModelAdapter } from '@angularflow/angular-signals-model';
import { ImageNodeComponent } from './node-template/image-node/image-node.component';
import { InputFieldNodeComponent } from './node-template/input-field-node/input-field-node.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [AngularAdapterDiagramComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  model = signal<SignalModelAdapter>(new SignalModelAdapter());
  nodeTemplateMap: NodeTemplateMap = new Map<string, Type<INodeTemplate>>([
    ['input-field', InputFieldNodeComponent],
    ['image', ImageNodeComponent],
  ]);

  constructor() {
    this.model().setNodes([
      { id: '1', type: 'input-field', position: { x: 300, y: 300 }, data: {} },
      { id: '2', type: 'image', position: { x: 500, y: 300 }, data: { imageUrl: 'https://tinyurl.com/bddnt44s' } },
      { id: '3', type: 'unknown', position: { x: 700, y: 300 }, data: {} },
    ]);
  }
}
