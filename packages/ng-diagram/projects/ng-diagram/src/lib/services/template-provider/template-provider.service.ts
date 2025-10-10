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

    if (!template && !this.accessedNodeTypes.has(nodeType) && this.flowConfig.provide().config.debugMode) {
      console.warn(`No template found for node type: '${nodeType}'`);
      this.accessedNodeTypes.add(nodeType);
    }

    return template ?? null;
  }

  getEdgeTemplate(edgeType: Edge['type']) {
    if (edgeType === undefined) {
      return null;
    }

    const template = this.edgeTemplateMap.get(edgeType || '');

    if (!template && !this.accessedEdgeTypes.has(edgeType) && this.flowConfig.provide().config.debugMode) {
      console.warn(`No template found for edge type: '${edgeType}'`);
      this.accessedEdgeTypes.add(edgeType);
    }

    return template ?? null;
  }
}
