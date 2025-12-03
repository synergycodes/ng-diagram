import { CommonModule } from '@angular/common';
import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  type OnDestroy,
  viewChild,
} from '@angular/core';
import {
  type NgDiagramNodeTemplate,
  NgDiagramViewportService,
  type Node,
} from 'ng-diagram';
import uPlot from 'uplot';
import {
  WorkflowNodeComponent,
  type WorkflowNodeData,
} from '../workflow-node/workflow-node.component';
import { createChartOptions } from './configure-chart';

@Component({
  selector: 'app-graph-node',
  imports: [CommonModule, WorkflowNodeComponent],
  templateUrl: './graph-node.component.html',
  styleUrls: ['./graph-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ng-diagram-port-hoverable]': 'true',
  },
})
export class GraphNodeComponent
  implements NgDiagramNodeTemplate<WorkflowNodeData>, AfterViewInit, OnDestroy
{
  private readonly viewportService = inject(NgDiagramViewportService);
  private chart?: uPlot;

  node = input.required<Node<WorkflowNodeData>>();
  title = computed(() => this.node()?.data?.title || 'Graph');

  chartContainer = viewChild<ElementRef<HTMLDivElement>>('chartContainer');

  ngAfterViewInit(): void {
    const container = this.chartContainer()?.nativeElement;
    if (!container) {
      return;
    }

    const data = this.getSampleData();
    const options = createChartOptions(this.viewportService);

    this.chart = new uPlot(options, data, container);
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private getSampleData(): uPlot.AlignedData {
    const dayIndices = [0, 1, 2, 3, 4, 5, 6];
    const newUsersPerDay = [450, 520, 480, 560, 620, 700, 850];

    return [dayIndices, newUsersPerDay];
  }
}
