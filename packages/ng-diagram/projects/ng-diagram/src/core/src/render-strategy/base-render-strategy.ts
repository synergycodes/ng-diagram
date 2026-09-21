import type { FlowCore } from '../flow-core';
import type { Edge, Node, Viewport } from '../types';
import { RenderPerformanceLogger } from './render-performance-logger';
import type { RenderStrategy, RenderStrategyResult } from './render-strategy.interface';

export abstract class BaseRenderStrategy implements RenderStrategy {
  private readonly performanceLogger: RenderPerformanceLogger;

  constructor(protected readonly flowCore: FlowCore) {
    this.performanceLogger = new RenderPerformanceLogger();
  }

  abstract init(): void;

  abstract process(nodes: Node[], edges: Edge[], viewport: Viewport | undefined): RenderStrategyResult;

  abstract isNodeRendered(nodeId: string): boolean;

  protected render(): void {
    const { nodes, edges, metadata } = this.flowCore.getState();
    const linking = this.flowCore.actionStateManager.linking;
    const temporaryEdge = linking?.temporaryEdge;

    const { nodes: visibleNodes, edges: processedEdges } = this.process(nodes, edges, metadata.viewport);

    // An edge whose endpoint is being relinked is represented by the temporary
    // edge for the duration of the gesture — rendering both would show the
    // stale original underneath the preview.
    const relinkedEdgeId = linking?.relink?.edgeId;
    const visibleEdges = relinkedEdgeId ? processedEdges.filter((edge) => edge.id !== relinkedEdgeId) : processedEdges;

    // The temporary edge lives in action state, so hidden-computation never
    // stamps it — check its anchored end here, or hiding that node mid-gesture
    // leaves a rubber band dangling from nothing. During a target-end drag the
    // anchored end is the source; during a source-end relink it is the target.
    const anchoredEndNodeId = linking?.relink?.end === 'source' ? temporaryEdge?.target : temporaryEdge?.source;
    const isTemporaryEdgeVisible =
      temporaryEdge?.temporary && !(anchoredEndNodeId && this.flowCore.getNodeById(anchoredEndNodeId)?.computedHidden);
    const finalEdges = isTemporaryEdgeVisible ? [...visibleEdges, temporaryEdge] : visibleEdges;

    this.performanceLogger.withPerformanceLogging(
      () => this.flowCore.renderer.draw(visibleNodes, finalEdges, metadata.viewport),
      visibleNodes,
      this.flowCore.config.debugMode
    );
  }
}
