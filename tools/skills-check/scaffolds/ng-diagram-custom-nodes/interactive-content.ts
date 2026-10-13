// snippet: <input [value]="node().data.title" (change)="rename($event)" data-no-drag="true" data-no-pan="true" />
@Component({
  selector: 'app-interactive-node',
  template: ` /* @snippet */ `,
})
export class InteractiveNodeComponent {
  readonly node = input.required<Node<{ title: string }>>();

  rename(event: Event): void {}
  addItem(): void {}
}
