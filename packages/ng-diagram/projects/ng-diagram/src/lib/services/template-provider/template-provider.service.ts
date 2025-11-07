import { inject, Injectable } from '@angular/core';
import { Edge, Node } from '../../../public-api';
import { NgDiagramEdgeTemplateMap, NgDiagramNodeTemplateMap } from '../../types';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';

@Injectable()
export class TemplateProviderService {
  private flowConfig = inject(FlowCoreProviderService);
  private nodeTemplateMap = new NgDiagramNodeTemplateMap();
  private edgeTemplateMap = new NgDiagramEdgeTemplateMap();

  private accessedNodeTypes = new Set<Node['type']>();
  private accessedEdgeTypes = new Set<Edge['type']>();

  setNodeTemplateMap(map: NgDiagramNodeTemplateMap): void {
    this.accessedNodeTypes.clear();
    this.nodeTemplateMap = map;
  }

  setEdgeTemplateMap(map: NgDiagramEdgeTemplateMap): void {
    this.accessedEdgeTypes.clear();
    this.edgeTemplateMap = map;
  }

  getNodeTemplate(nodeType: Node['type']) {
    if (nodeType === undefined) {
      return null;
    }

    const template = this.nodeTemplateMap.get(nodeType || '');

    if (!template && !this.accessedNodeTypes.has(nodeType)) {
      console.warn(
        `[ngDiagram] Node template '${nodeType}' is not registered. Falling back to default node template.

Documentation: https://www.ngdiagram.dev/docs/guides/nodes/custom-nodes/
`
      );
      this.accessedNodeTypes.add(nodeType);
    }

    return template ?? null;
  }

  getEdgeTemplate(edgeType: Edge['type']) {
    if (edgeType === undefined) {
      return null;
    }

    const template = this.edgeTemplateMap.get(edgeType || '');

    if (!template && !this.accessedEdgeTypes.has(edgeType)) {
      console.warn(
        `[ngDiagram] Edge template '${edgeType}' is not registered. Falling back to default edge template.

Documentation: https://www.ngdiagram.dev/docs/guides/edges/custom-edges/
`
      );
      this.accessedEdgeTypes.add(edgeType);
    }

    return template ?? null;
  }
}
