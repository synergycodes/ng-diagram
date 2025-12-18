import type { FlowCore } from '../flow-core';
import type { Edge, Node, Viewport } from '../types';
import type { RenderStrategy, RenderStrategyResult } from './render-strategy.interface';

export abstract class BaseRenderStrategy implements RenderStrategy {
  constructor(protected readonly flowCore: FlowCore) {}

  abstract init(): void;

  abstract process(nodes: Node[], edges: Edge[], viewport: Viewport | undefined): RenderStrategyResult;

  protected render(): void {
    const { nodes, edges, metadata } = this.flowCore.getState();
    const temporaryEdge = this.flowCore.actionStateManager.linking?.temporaryEdge;

    const { nodes: visibleNodes, edges: visibleEdges } = this.process(nodes, edges, metadata.viewport);

    const finalEdges = temporaryEdge?.temporary ? [...visibleEdges, temporaryEdge] : visibleEdges;

    this.flowCore.renderer.draw(visibleNodes, finalEdges, metadata.viewport);
  }
}
