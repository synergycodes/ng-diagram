import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, signal, Type, ViewChild } from '@angular/core';
import { AngularAdapterDiagramComponent, INodeTemplate, Node, NodeTemplateMap } from '@angularflow/angular-adapter';
import { ImageNodeComponent } from './node-template/image-node/image-node.component';
import { InputFieldNodeComponent } from './node-template/input-field-node/input-field-node.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [AngularAdapterDiagramComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnDestroy {
  private intervalId: number | null = null;

  @ViewChild('diagramContainer')
  private readonly diagramContainer!: ElementRef<HTMLElement>;

  nodes = signal<Node[]>([
    { id: '1', type: 'input-field', position: { x: 300, y: 300 }, data: {} },
    {
      id: '2',
      type: 'image',
      position: { x: 500, y: 300 },
      data: {
        imageUrl: 'https://tinyurl.com/bddnt44s',
      },
    },
  ]);
  nodeTemplateMap: NodeTemplateMap = new Map<string, Type<INodeTemplate>>([
    ['input-field', InputFieldNodeComponent as unknown as Type<INodeTemplate>],
    ['image', ImageNodeComponent as unknown as Type<INodeTemplate>],
  ]);

  constructor() {
    this.intervalId = window.setInterval(() => {
      this.nodes.update((nodes) =>
        nodes.map((node) => ({
          ...node,
          position: this.randomizePosition(),
        }))
      );
    }, 3000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }
  }

  private randomizePosition() {
    const { width, height } = this.diagramContainer.nativeElement.getBoundingClientRect();
    return {
      x: Math.random() * (width - 200),
      y: Math.random() * (height - 200),
    };
  }
}
