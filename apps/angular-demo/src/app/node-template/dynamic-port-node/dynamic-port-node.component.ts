import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  NgDiagramNodeSelectedDirective,
  NgDiagramNodeTemplate,
  NgDiagramPortComponent,
  Node,
  type OriginPoint,
  type PortSide,
} from 'ng-diagram';

export interface DynamicPortData {
  text?: string;
  ports: { id: string; side: PortSide; originPoint?: OriginPoint }[];
  contentSize?: 'small' | 'large';
}

interface ComputedPort {
  id: string;
  side: PortSide;
  originPoint: OriginPoint;
  top: string | null;
  left: string | null;
}

@Component({
  selector: 'app-dynamic-port-node',
  imports: [NgDiagramPortComponent],
  templateUrl: './dynamic-port-node.component.html',
  styleUrl: './dynamic-port-node.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: NgDiagramNodeSelectedDirective, inputs: ['node'] }],
  host: {
    '[class.ng-diagram-port-hoverable-over-node]': 'true',
  },
})
export class DynamicPortNodeComponent implements NgDiagramNodeTemplate<DynamicPortData> {
  node = input.required<Node<DynamicPortData>>();

  text = computed(() => this.node()?.data?.text || 'Dynamic Ports');
  contentSize = computed(() => this.node()?.data?.contentSize ?? 'small');

  ports = computed(() => {
    const dataPorts = this.node()?.data?.ports ?? [];
    return this.withPositions(dataPorts);
  });

  private withPositions(ports: DynamicPortData['ports']): ComputedPort[] {
    const sideCount = new Map<PortSide, number>();
    const portIndex = new Map<string, number>();

    for (const port of ports) {
      const count = sideCount.get(port.side) ?? 0;
      portIndex.set(port.id, count);
      sideCount.set(port.side, count + 1);
    }

    return ports.map((port) => {
      const index = portIndex.get(port.id)!;
      const total = sideCount.get(port.side)!;
      const pct = `${((index + 1) / (total + 1)) * 100}%`;
      const isVerticalSide = port.side === 'left' || port.side === 'right';

      return {
        id: port.id,
        side: port.side,
        originPoint: port.originPoint ?? 'center',
        top: isVerticalSide ? pct : null,
        left: !isVerticalSide ? pct : null,
      };
    });
  }
}
