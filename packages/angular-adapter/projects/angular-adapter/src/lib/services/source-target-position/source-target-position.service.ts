import { inject, Injectable } from '@angular/core';
import { Point, getPoint, Edge } from '@angularflow/core';
import { FlowCoreProviderService } from '../../../public-api';

@Injectable({ providedIn: 'root' })
export class SourceTargetPositionService {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  getSourceAndTargetPositions(edge: Edge): Point[] {
    const source = this.flowCoreProvider.provide().getNodeById(edge.source);
    const target = this.flowCoreProvider.provide().getNodeById(edge.target);
    if (!source || !target) return [];

    const sourcePoint = getPoint(source, 'right', edge.sourcePort) as Point;
    const targetPoint = getPoint(target, 'left', edge.targetPort) as Point;

    return [sourcePoint, targetPoint].filter((point) => !!point);
  }
}
